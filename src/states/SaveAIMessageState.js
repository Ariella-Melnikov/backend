import State from './state.js'

class SaveAIMessageState extends State {
    async handle(context) {
        const { dbService } = context.services
        const { userId, chatId, aiResponse, searchPreferences, requiresUserConfirmation } = context

        try {
            if (!aiResponse || !aiResponse.message) {
                console.error('❌ AI Response is missing. Cannot save.')
                return context.res.status(500).json({ error: 'AI Response missing.' })
            }

            // ✅ Prevent duplicate saves
            if (context.aiResponse.saved) {
                console.warn('⚠️ AI response already saved. Skipping...')
                return
            }

            await dbService.saveChatMessage(
                userId,
                chatId,
                {
                    role: 'assistant',
                    content: aiResponse.message.content,
                },
                false
            )

            // ✅ Mark response as saved
            context.aiResponse.saved = true

            console.log('💾 AI message saved:', {
                content: aiResponse.message.content,
                hasSearchPreferences: !!searchPreferences,
                requiresUserConfirmation: requiresUserConfirmation,
            })

            // ✅ Send response to frontend and RETURN immediately
            console.log('🚀 Sending response to frontend...');
            return context.res.json({
                message: aiResponse.message,
                searchPreferences: searchPreferences,
                requiresUserConfirmation: requiresUserConfirmation,
            })
        } catch (error) {
            console.error('❌ Error saving AI message:', error)
            return context.res.status(500).json({ error: 'Failed to save AI message' })
        }
    }
}

export default SaveAIMessageState
