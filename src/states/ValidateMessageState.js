import State from './state.js';

class ValidateMessageState extends State {
    async handle(context) {
        const { messages } = context.req.body;

        if (!Array.isArray(messages) || messages.some((m) => !m?.content)) {
            return context.res.status(400).json({ error: 'Invalid messages format' });
        }

        context.messages = messages;

        console.log('📩 Messages validated:', messages);
        
        context.transitionTo(context.chatManagementState);
        return context.handle();
    }
}

export default ValidateMessageState;
