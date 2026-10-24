async function createStudentNotification(client, input) {
  const { recipientId, type, title, body, dedupeKey, relatedUrl = null } = input;
  return client.studentNotification.upsert({
    where: { recipientId_dedupeKey: { recipientId, dedupeKey } },
    update: {},
    create: { recipientId, type, title, body, dedupeKey, relatedUrl },
  });
}

module.exports = { createStudentNotification };
