export const CommunicationMessagePattern = {
  // Chats
  CREATE_CHAT: 'create-chat',
  UPDATE_CHAT: 'update-chat',
  DELETE_CHAT: 'delete-chat',
  FIND_CHAT_BY_ID: 'find-chat-by-id',
  GET_USER_CHATS: 'get-user-chats',
  ADD_USER_TO_CHAT: 'add-user-to-chat',
  REMOVE_USER_FROM_CHAT: 'remove-user-from-chat',
  PASS_OWNERSHIP: 'pass-ownership',
  UPDATE_USER_CHAT_PERMISSIONS: 'update-user-chat-permissions',

  // Messages
  SEND_MESSAGE: 'send-message',
  UPDATE_MESSAGE: 'update-message',
  DELETE_MESSAGE: 'delete-message',
  READ_MESSAGES: 'read-messages',
  DELETE_OTHER_MESSAGES: 'delete-other-messages',
}