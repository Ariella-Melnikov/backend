import AuthenticateUserState from './AuthenticateUserState.js';
import ValidateMessageState from './ValidateMessageState.js';
import ChatManagementState from './ChatManagementState.js';
import SaveUserMessageState from './SaveUserMessageState.js';
import GenerateAIResponseState from './GenerateAIResponseState.js';
import SaveAIMessageState from './SaveAIMessageState.js';

import ConfirmSearchState from './ConfirmSearchState.js';
import GoogleSearchState from './GoogleSearchState.js';
import ScrapeListingsState from './ScrapeListingsState.js';
import SavePropertiesState from './SavePropertiesState.js';

class ChatbotContext {
    constructor(req, res, services) {
        this.req = req;
        this.res = res;
        this.services = services;
        
        this.userId = null;
        this.chatId = null;
        this.messages = [];
        this.isNewSession = false;
        this.aiResponse = null;
        this.searchPreferences = null;
        this.requiresUserConfirmation = false;
        this.searchResults = null;
        this.listingUrls = [];
        this.scrapedProperties = [];

        // Instantiate states
        this.authenticateUserState = new AuthenticateUserState();
        this.validateMessageState = new ValidateMessageState();
        this.chatManagementState = new ChatManagementState();
        this.saveUserMessageState = new SaveUserMessageState();
        this.generateAIResponseState = new GenerateAIResponseState();
        this.saveAIMessageState = new SaveAIMessageState();

        this.confirmSearchState = new ConfirmSearchState();
        this.googleSearchState = new GoogleSearchState();
        this.scrapeListingsState = new ScrapeListingsState();
        this.savePropertiesState = new SavePropertiesState();

        // Start with AuthenticateUserState
        this.currentState = this.authenticateUserState;
    }

    transitionTo(state) {
        console.log('🔄 Transitioning to state:', state.constructor.name);
        this.currentState = state;
    }

    async handle() {
        return this.currentState.handle(this);
    }
}

export default ChatbotContext;
