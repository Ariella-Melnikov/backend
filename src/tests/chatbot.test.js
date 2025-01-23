import fetch from 'node-fetch';

async function testChatbot() {
    try {
        console.log('🤖 Testing Chatbot Connection...');
        
        const response = await fetch('http://localhost:3030/api/chatbot', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [
                    { role: "user", content: "I'm looking for a house in Tel Aviv" }
                ]
            })
        });

        const data = await response.json();
        console.log('\n✅ Server Response:');
        console.log('Status:', response.status);
        console.log('AI Response:', data.message.content);
        console.log('Search Criteria:', data.searchCriteria);
        
    } catch (error) {
        console.error('\n❌ Test Failed:');
        console.error('Error:', error.message);
    }
}

testChatbot();
