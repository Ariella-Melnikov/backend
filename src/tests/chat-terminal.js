import readline from 'readline';
import fetch from 'node-fetch';
import colors from 'colors';

// Create interface for terminal input/output
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Store conversation history
let messages = [];

const API_URL = 'http://localhost:3030/api/chatbot';

console.log(colors.cyan('\n🤖 HomiBot: Hello! I\'m here to help you find your ideal home. What are you looking for?\n'));

// Function to chat with the bot
async function chatWithBot() {
    try {
        // Get user input
        const userInput = await new Promise((resolve) => {
            rl.question(colors.green('You: '), (answer) => {
                resolve(answer);
            });
        });

        // Exit if user types 'exit'
        if (userInput.toLowerCase() === 'exit') {
            console.log(colors.cyan('\n🤖 HomiBot: Goodbye! Have a great day!\n'));
            rl.close();
            return;
        }

        // Add user message to history
        messages.push({ role: 'user', content: userInput });

        console.log('Sending request to:', API_URL);
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: userInput }]
            })
        }).catch(error => {
            console.error('Network error:', error.message);
            throw error;
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server response:', response.status, errorText);
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        
        // Add bot response to history
        messages.push(data.message);

        // Display bot response
        console.log(colors.cyan('\n🤖 HomiBot: ' + data.message.content + '\n'));

        // If search criteria was extracted, show it
        if (data.searchCriteria && Object.values(data.searchCriteria).some(v => v !== null)) {
            console.log(colors.yellow('📋 Search Criteria Extracted:'));
            console.log(colors.yellow(JSON.stringify(data.searchCriteria, null, 2) + '\n'));
        }

        // Continue the conversation
        chatWithBot();

    } catch (error) {
        console.error('Detailed error:', error);
        console.error('Is the server running on port 3030?');
        console.error('Check that the chatbot route is properly set up in server.js');
        rl.close();
    }
}

// Start the conversation
console.log('Starting chat bot test...');
console.log('Attempting to connect to:', API_URL);
console.log('Start chatting with the bot (type "exit" to end the conversation)\n');
chatWithBot();