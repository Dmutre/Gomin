-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_chatId_fkey";

-- DropForeignKey
ALTER TABLE "user_chats" DROP CONSTRAINT "user_chats_chatId_fkey";

-- AddForeignKey
ALTER TABLE "user_chats" ADD CONSTRAINT "user_chats_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;
