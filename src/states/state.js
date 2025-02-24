class State {
    async handle(context) {
        throw new Error("handle() must be implemented by subclass.");
    }
}

export default State;
