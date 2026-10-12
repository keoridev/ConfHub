function filterFiles(incomingFiles, databaseEntries) {
  const existingIds = new Set(
    databaseEntries
      .filter((entry) => entry?.json?.resource_id_text != null)
      .map((entry) => String(entry.json.resource_id_text).trim().toLowerCase())
  );

  const seenIds = new Set();
  const result = [];

  for (const file of incomingFiles) {
    if (!file?.json?.resource_id) continue;

    const fileId = String(file.json.resource_id).trim().toLowerCase();

    if (!existingIds.has(fileId) && !seenIds.has(fileId)) {
      seenIds.add(fileId);
      result.push(file);
    }
  }

  return result;
}

const testCases = [
  {
    name: "✅ Стандартный случай: 2 новых файла, 1 дубликат",
    incoming: [
      { json: { resource_id: "123", name: "File1.txt" } },
      { json: { resource_id: "456", name: "File2.txt" } },
      { json: { resource_id: "123", name: "File1_duplicate.txt" } },
    ],
    existing: [
      { json: { resource_id_text: "789" } },
    ],
    expected: [
      { json: { resource_id: "123", name: "File1.txt" } },
      { json: { resource_id: "456", name: "File2.txt" } },
    ],
  },
  {
    name: "✅ Файл уже в БД",
    incoming: [{ json: { resource_id: "999", name: "File3.txt" } }],
    existing: [
      { json: { resource_id_text: "999" } },
    ],
    expected: [],
  },
  {
    name: "✅ Пустые и некорректные данные",
    incoming: [
      { json: { resource_id: null } },
      { json: {} },
      { json: { resource_id: "  ABC  " } },
      { json: { resource_id: "abc" } },
    ],
    existing: [],
    expected: [
      { json: { resource_id: "  ABC  " } },
    ],
  },
];

testCases.forEach((test, index) => {
  const result = filterFiles(test.incoming, test.existing);
  const isPassed = JSON.stringify(result) === JSON.stringify(test.expected);

  console.log(`\nТест #${index + 1}: ${test.name}`);
  console.log("Ожидаемый результат:", test.expected);
  console.log("Фактический результат:", result);
  console.log(isPassed ? "✅ ПРОЙДЕН" : "❌ ПРОВАЛЕН");
});
