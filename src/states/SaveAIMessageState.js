import State from './state.js';

class SaveAIMessageState extends State {
    async handle(context) {
        const { dbService } = context.services;
        const { userId, chatId, aiResponse } = context;

        try {
            await dbService.saveChatMessage(userId, chatId, {
                role: 'assistant',
                content: aiResponse.message.content
            }, false);

            console.log('💾 AI message saved:', aiResponse.message.content);

            context.transitionTo(context.confirmSummaryState);
            return context.handle();
        } catch (error) {
            console.error('❌ Error saving AI message:', error);
            return context.res.status(500).json({ error: 'Failed to save AI message' });
        }
    }
}

export default SaveAIMessageState;
