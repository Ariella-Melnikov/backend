import State from './state.js';

class SaveUserMessageState extends State {
    async handle(context) {
        const { dbService } = context.services;
        const { userId, chatId, messages, isNewSession } = context;

        try {
            const userMessage = messages[messages.length - 1];

            await dbService.saveChatMessage(userId, chatId, {
                role: 'user',
                content: userMessage.content
            }, isNewSession);

            console.log('💾 User message saved:', userMessage.content);

            context.transitionTo(context.generateAIResponseState);
            return context.handle();
        } catch (error) {
            console.error('❌ Error saving user message:', error);
            return context.res.status(500).json({ error: 'Failed to save user message' });
        }
    }
}

export default SaveUserMessageState;
