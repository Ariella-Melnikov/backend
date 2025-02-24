import State from './state.js';

class ChatManagementState extends State {
    async handle(context) {
        const { dbService } = context.services;
        const { userId } = context;

        try {
            const { chatId, isNewSession } = await dbService.getOrCreateChat(userId);
            context.chatId = chatId;
            context.isNewSession = isNewSession;

            console.log('💬 Chat session managed:', { chatId, isNewSession });

            context.transitionTo(context.saveUserMessageState);
            return context.handle();
        } catch (error) {
            console.error('❌ Chat management error:', error);
            return context.res.status(500).json({ error: 'Failed to manage chat session' });
        }
    }
}

export default ChatManagementState;
