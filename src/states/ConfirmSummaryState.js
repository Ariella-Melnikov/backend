import State from './state.js';

class ConfirmSummaryState extends State {
    async handle(context) {
        const { aiResponse, res } = context;

        if (aiResponse.requiresUserConfirmation) {
            console.log('✅ Sending confirmation request to frontend');
            return res.json({
                message: aiResponse.message,
                searchPreferences: aiResponse.searchPreferences,
                requiresUserConfirmation: true
            });
        }

        return res.json({ message: aiResponse.message });
    }
}

export default ConfirmSummaryState;
