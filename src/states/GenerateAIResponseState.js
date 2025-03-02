import State from './state.js'

class GenerateAIResponseState extends State {
    async handle(context) {
        const { openAiService } = context.services
        const { messages } = context

        try {
            console.log('🔄 Generating AI response...')

            // Get response and extracted parameters from OpenAI service
            const { message, searchPreferences, requiresUserConfirmation } = await openAiService.chatWithAI(messages)

            // Store response in context
            context.aiResponse = {
                message,
                searchPreferences,
                requiresUserConfirmation,
            }

            console.log('🤖 Updated AI Response stored in Context:', JSON.stringify(context.aiResponse, null, 2));

            // If search preferences exist, return them immediately
            if (searchPreferences) {
                    console.log('🚀 Sending response to frontend:', JSON.stringify({
                        message: context.aiResponse.message,
                        searchPreferences,
                        requiresUserConfirmation
                    }, null, 2));
                
                    return context.res.json({
                        message: context.aiResponse.message,
                        searchPreferences,
                        requiresUserConfirmation
                    });
                    
            }

            // ✅ Otherwise, transition to SaveAIMessageState
            // ✅ Ensure we do not transition multiple times
            if (context.transitionedToSaveAIMessageState) {
                console.warn('⚠️ Already transitioned to SaveAIMessageState. Skipping...')
                return
            }

            context.transitionedToSaveAIMessageState = true

            console.log('🔄 Transitioning to SaveAIMessageState...')
            context.transitionTo(context.saveAIMessageState)
            return context.handle()
        } catch (error) {
            console.error('❌ Error generating AI response:', error)
            return context.res.status(500).json({ error: 'Failed to generate AI response' })
        }
    }
}

export default GenerateAIResponseState
