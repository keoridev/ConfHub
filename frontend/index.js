/**
 * Фильтрует и удаляет дубликаты файлов, которых ещё нет в БД.
 * @param {Array} incomingFiles - Входящие файлы (из источника).
 * @param {Array} databaseEntries - Записи из базы данных.
 * @returns {Array} - Отфильтрованные и уникальные файлы.
 */
function filterFiles(incomingFiles, databaseEntries) {
  // 1. Собираем все ID из БД в Set (для быстрого поиска)
  const existingIds = new Set(
    databaseEntries
      .filter((entry) => entry?.json?.resource_id_text != null) // Игнорируем пустые
      .map((entry) => String(entry.json.resource_id_text).trim().toLowerCase())
  );

  // 2. Фильтруем входящие файлы + удаляем дубликаты
  const seenIds = new Set();
  const result = [];

  for (const file of incomingFiles) {
    if (!file?.json?.resource_id) continue; // Пропускаем файлы без ID

    const fileId = String(file.json.resource_id).trim().toLowerCase();

    // Если ID нет в БД и ещё не встречался среди входящих
    if (!existingIds.has(fileId) && !seenIds.has(fileId)) {
      seenIds.add(fileId);
      result.push(file);
    }
  }

  return result;
}

// Тестовые данные
const testCases = [
  {
    name: "✅ Стандартный случай: 2 новых файла, 1 дубликат",
    incoming: [
      { json: { resource_id: "123", name: "File1.txt" } },
      { json: { resource_id: "456", name: "File2.txt" } },
      { json: { resource_id: "123", name: "File1_duplicate.txt" } }, // Должен быть отфильтрован
    ],
    existing: [
      { json: { resource_id_text: "789" } }, // В БД лежит несуществующий ID
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
      { json: { resource_id_text: "999" } }, // Должен быть отфильтрован
    ],
    expected: [],
  },
  {
    name: "✅ Пустые и некорректные данные",
    incoming: [
      { json: { resource_id: null } },
      { json: {} },
      { json: { resource_id: "  ABC  " } }, // Пробелы должны обрезаться
      { json: { resource_id: "abc" } }, // Дубликат после trim() + lowercase()
    ],
    existing: [],
    expected: [
      { json: { resource_id: "  ABC  " } }, // В результатах останется первый вариант (но ID будет нормализован при сравнении)
    ],
  },
];

// Запуск тестов
testCases.forEach((test, index) => {
  const result = filterFiles(test.incoming, test.existing);
  const isPassed = JSON.stringify(result) === JSON.stringify(test.expected);

  console.log(`\nТест #${index + 1}: ${test.name}`);
  console.log("Ожидаемый результат:", test.expected);
  console.log("Фактический результат:", result);
  console.log(isPassed ? "✅ ПРОЙДЕН" : "❌ ПРОВАЛЕН");
});
