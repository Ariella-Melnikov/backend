import State from './state.js';

class GenerateAIResponseState extends State {
    async handle(context) {
        const { openAiService } = context.services;
        const { messages } = context;

        try {
            const response = await openAiService.chatWithAI(messages);
            context.aiResponse = response;

            console.log('🤖 OpenAI Response generated:', response);

            context.transitionTo(context.saveAIMessageState);
            return context.handle();
        } catch (error) {
            console.error('❌ Error generating AI response:', error);
            return context.res.status(500).json({ error: 'Failed to generate AI response' });
        }
    }
}

export default GenerateAIResponseState;
