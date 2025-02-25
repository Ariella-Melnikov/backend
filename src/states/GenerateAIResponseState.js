import State from './state.js';

class GenerateAIResponseState extends State {
    async handle(context) {
        const { openAiService } = context.services;
        const { messages } = context;

        try {
            console.log('🔄 Generating AI response...');
            
            // ✅ Step 1: Get response from OpenAI
            const response = await openAiService.chatWithAI(messages);

            console.log('🤖 Raw AI Response:', response.message.content);

            // ✅ Step 2: Extract structured search preferences **before saving**
            if (response.searchPreferences) {
                console.log('✅ Search preferences detected:', response.searchPreferences);
                context.searchPreferences = response.searchPreferences;
                context.requiresUserConfirmation = response.requiresUserConfirmation;
            } else {
                console.log('⚠️ No structured search preferences detected');
                context.searchPreferences = null;
                context.requiresUserConfirmation = false;
            }

            // ✅ Step 3: Store response in context BEFORE transitioning
            context.aiResponse = {
                message: response.message,
                searchPreferences: context.searchPreferences,
                requiresUserConfirmation: context.requiresUserConfirmation
            };

            console.log('🤖 Updated AI Response stored in Context:', context.aiResponse);

            // ✅ Step 4: If search preferences exist, return them immediately
            if (context.searchPreferences) {
                return context.res.json({
                    message: context.aiResponse.message,
                    searchPreferences: context.searchPreferences,
                    requiresUserConfirmation: context.requiresUserConfirmation
                });
            }

            // ✅ Step 5: If no preferences, transition to save message state
            console.log('🔄 Transitioning to SaveAIMessageState...');
            context.transitionTo(context.saveAIMessageState);
            return context.handle();

        } catch (error) {
            console.error('❌ Error generating AI response:', error);
            return context.res.status(500).json({ error: 'Failed to generate AI response' });
        }
    }
}

export default GenerateAIResponseState;
