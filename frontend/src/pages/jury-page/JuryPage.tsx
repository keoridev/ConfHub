import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import { Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { pathKeys } from "~shared/lib";
import { ConfirmLogoutModal } from "~shared/ui";
import {
  useReviewTalkMutation,
  useSetKeynoteMutation,
  useJuryQueueQuery,
  useRoomsQuery,
  useSectionsQuery,
  useCurrentUserQuery,
  useLogout,
} from "~entities/talk/api/queries";
import type { Talk } from "~entities/talk/model/types";

import { JuryCard } from "./ui/JuryCard";
import { JuryTalkDetailModal } from "./ui/JuryTalkDetailModal";
import { JuryApproveModal, JuryFeedbackModal } from "./ui/JuryDecisionModal";
import { JuryAuthGuard } from "./ui/JuryAuthGuard";
import { JuryHeader } from "./ui/JuryHeader";

export function JuryPage() {
  const { data: user } = useCurrentUserQuery();
  const logout = useLogout();
  const navigate = useNavigate();

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "pending_review" | "approved" | "needs_revision" | "rejected"
  >("pending_review");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: talks = [], isLoading } = useJuryQueueQuery(1, activeTab);
  const { data: rooms = [] } = useRoomsQuery();
  const { data: sections = [] } = useSectionsQuery();

  const reviewMutation = useReviewTalkMutation();
  const keynoteMutation = useSetKeynoteMutation();

  const [targetTalk, setTargetTalk] = useState<Talk | null>(null);
  const [selectedDetailTalk, setSelectedDetailTalk] = useState<Talk | null>(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"needs_revision" | "rejected">(
    "needs_revision"
  );

  const [approveRoomId, setApproveRoomId] = useState("");
  const [selectedDate, setSelectedDate] = useState("2026-11-10");
  const [selectedSlot, setSelectedSlot] = useState("10:00 - 10:10");
  const [isKeynoteOption, setIsKeynoteOption] = useState(false);
  const [customStartTime, setCustomStartTime] = useState("");
  const [customEndTime, setCustomEndTime] = useState("");

  const [feedbackComment, setFeedbackComment] = useState("");

  const handleOpenApprove = (talk: Talk) => {
    setTargetTalk(talk);
    setApproveRoomId(
      talk.room?.id
        ? String(talk.room.id)
        : rooms[0]?.id
        ? String(rooms[0].id)
        : "1"
    );
    setSelectedDate("2026-11-10");
    setIsKeynoteOption(Boolean(talk.isKeynote));
    setSelectedSlot(talk.isKeynote ? "10:00 - 10:15" : "10:00 - 10:10");
    setIsApproveModalOpen(true);
  };

  const handleConfirmApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTalk) return;

    if (!approveRoomId) {
      toast.error("Выберите аудиторию");
      return;
    }

    let startIso = "";
    let endIso = "";

    if (customStartTime && customEndTime) {
      startIso = new Date(customStartTime).toISOString();
      endIso = new Date(customEndTime).toISOString();
    } else {
      const [startH, endH] = selectedSlot.split(" - ");
      startIso = new Date(`${selectedDate}T${startH}:00+06:00`).toISOString();
      endIso = new Date(`${selectedDate}T${endH}:00+06:00`).toISOString();
    }

    try {
      if (isKeynoteOption !== Boolean(targetTalk.isKeynote)) {
        await keynoteMutation.mutateAsync({
          talkId: targetTalk.id,
          isKeynote: isKeynoteOption,
        });
      }

      await reviewMutation.mutateAsync({
        id: targetTalk.id,
        data: {
          status: "approved",
          roomId: Number(approveRoomId),
          startTime: startIso,
          endTime: endIso,
        },
      });
      toast.success(`Доклад «${targetTalk.title}» одобрен и добавлен в расписание!`);
      setIsApproveModalOpen(false);
      setTargetTalk(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Ошибка утверждения доклада");
    }
  };

  const handleOpenFeedback = (talk: Talk, type: "needs_revision" | "rejected") => {
    setTargetTalk(talk);
    setFeedbackType(type);
    setFeedbackComment("");
    setIsFeedbackModalOpen(true);
  };

  const handleConfirmFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTalk) return;

    if (!feedbackComment.trim()) {
      toast.error("Укажите причину или замечания для автора");
      return;
    }

    try {
      await reviewMutation.mutateAsync({
        id: targetTalk.id,
        data: {
          status: feedbackType,
          juryComment: feedbackComment.trim(),
        },
      });
      if (feedbackType === "needs_revision") {
        toast.info(`Заявка «${targetTalk.title}» отправлена автору на доработку`);
      } else {
        toast.error(`Заявка «${targetTalk.title}» отклонена`);
      }
      setIsFeedbackModalOpen(false);
      setTargetTalk(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Ошибка обновления статуса заявки");
    }
  };

  const safeTalks = Array.isArray(talks) ? talks : [];

  const filteredTalks = useMemo(() => {
    return safeTalks.filter((t) => {
      const secId = t.sectionId ?? t.section?.id;
      if (selectedSectionId !== "all" && String(secId) !== selectedSectionId) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchSpeaker = (t.speakerName || "").toLowerCase().includes(q);
        const matchSupervisor = (t.supervisor || "").toLowerCase().includes(q);
        const matchGroup = (t.gradeOrGroup || "").toLowerCase().includes(q);
        const matchUniv = (t.university || "").toLowerCase().includes(q);
        const matchCo = (t.coAuthors || []).some((ca) =>
          ca.toLowerCase().includes(q)
        );
        if (
          !matchTitle &&
          !matchSpeaker &&
          !matchSupervisor &&
          !matchGroup &&
          !matchUniv &&
          !matchCo
        ) {
          return false;
        }
      }
      return true;
    });
  }, [safeTalks, selectedSectionId, searchQuery]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <JuryHeader
        user={user}
        onOpenLogout={() => setIsLogoutModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabCount={safeTalks.length}
        sections={sections}
        selectedSectionId={selectedSectionId}
        setSelectedSectionId={setSelectedSectionId}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <div className="space-y-8">
        <JuryAuthGuard
          user={user}
          onOpenLogout={() => setIsLogoutModalOpen(true)}
        />

        {user && (user.role === "jury" || user.role === "admin") && (
          <div>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-80 bg-white rounded-2xl border border-[#1a4d3e]/10 p-6 animate-pulse"
                  />
                ))}
              </div>
            ) : filteredTalks.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#1a4d3e]/15 p-12 text-center space-y-4 shadow-sm">
                <div className="size-16 rounded-2xl bg-[#1a4d3e]/10 text-[#1a4d3e] flex items-center justify-center mx-auto shadow-xs">
                  <Clock className="size-8 text-[#d4a84b]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-[#1a4d3e]">
                    Нет докладов в этой категории
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    {activeTab === "pending_review"
                      ? "Все поступившие заявки обработаны. Новые заявки от студентов появятся здесь автоматически."
                      : "В выбранной секции нет докладов с данным статусом."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTalks.map((talk) => (
                  <JuryCard
                    key={talk.id}
                    talk={talk}
                    onApproveClick={handleOpenApprove}
                    onRejectClick={(t) => handleOpenFeedback(t, "rejected")}
                    onRevisionClick={(t) => handleOpenFeedback(t, "needs_revision")}
                    onInspectClick={(t) => setSelectedDetailTalk(t)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <JuryTalkDetailModal
        talk={selectedDetailTalk}
        isOpen={Boolean(selectedDetailTalk)}
        onClose={() => setSelectedDetailTalk(null)}
        onApproveClick={handleOpenApprove}
        onRejectClick={(t) => handleOpenFeedback(t, "rejected")}
        onRevisionClick={(t) => handleOpenFeedback(t, "needs_revision")}
      />

      <JuryApproveModal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        targetTalk={targetTalk}
        rooms={rooms}
        approveRoomId={approveRoomId}
        setApproveRoomId={setApproveRoomId}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedSlot={selectedSlot}
        setSelectedSlot={setSelectedSlot}
        customStartTime={customStartTime}
        setCustomStartTime={setCustomStartTime}
        setCustomEndTime={setCustomEndTime}
        isKeynoteOption={isKeynoteOption}
        setIsKeynoteOption={setIsKeynoteOption}
        onConfirm={handleConfirmApprove}
        isPending={reviewMutation.isPending}
      />

      <JuryFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        targetTalk={targetTalk}
        feedbackType={feedbackType}
        setFeedbackType={setFeedbackType}
        feedbackComment={feedbackComment}
        setFeedbackComment={setFeedbackComment}
        onConfirm={handleConfirmFeedback}
        isPending={reviewMutation.isPending}
      />

      <ConfirmLogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={() => {
          logout();
          navigate(pathKeys.login);
        }}
        user={user}
      />
    </div>
  );
}

export const juryPageRoute = { element: <JuryPage /> };
