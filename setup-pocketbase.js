const PocketBase = require('pocketbase/cjs');

async function setupCollections() {
    const pb = new PocketBase('http://127.0.0.1:8090');
    
    console.log('Setting up PocketBase collections...');
    
    try {
        // Admin credentials
        const email = 'mohdanas211@gmail.com';
        const password = 'Curiousity@1111';
        
        // Authenticate as admin
        await pb.admins.authWithPassword(email, password);
        console.log('✅ Admin authentication successful');
        
        // Create invoices collection
        const invoicesCollection = {
            name: 'invoices',
            type: 'base',
            schema: [
                {
                    name: 'client_name',
                    type: 'text',
                    required: true,
                    options: {
                        min: null,
                        max: null,
                        pattern: ''
                    }
                },
                {
                    name: 'total_amount',
                    type: 'number',
                    required: true,
                    options: {
                        min: null,
                        max: null
                    }
                },
                {
                    name: 'subtotal',
                    type: 'number',
                    required: true,
                    options: {
                        min: null,
                        max: null
                    }
                },
                {
                    name: 'gst_amount',
                    type: 'number',
                    required: true,
                    options: {
                        min: null,
                        max: null
                    }
                },
                {
                    name: 'invoice_data',
                    type: 'json',
                    required: true,
                    options: {}
                },
                {
                    name: 'user',
                    type: 'relation',
                    required: true,
                    options: {
                        collectionId: '', // Will be filled automatically
                        cascadeDelete: false,
                        minSelect: null,
                        maxSelect: 1,
                        displayFields: ['email']
                    }
                }
            ],
            listRule: '@request.auth.id != "" && user = @request.auth.id',
            viewRule: '@request.auth.id != "" && user = @request.auth.id',
            createRule: '@request.auth.id != ""',
            updateRule: '@request.auth.id != "" && user = @request.auth.id',
            deleteRule: '@request.auth.id != "" && user = @request.auth.id',
            options: {}
        };
        
        // Check if collection already exists
        try {
            await pb.collections.getOne('invoices');
            console.log('ℹ️  Invoices collection already exists');
        } catch (error) {
            // Collection doesn't exist, create it
            await pb.collections.create(invoicesCollection);
            console.log('✅ Invoices collection created successfully');
        }
        
        // The users collection should already exist by default
        console.log('✅ Setup complete!');
        console.log('');
        console.log('Collections created:');
        console.log('- users (built-in authentication)');
        console.log('- invoices (for storing invoice data)');
        console.log('');
        console.log('You can now use the React app with PocketBase!');
        
    } catch (error) {
        console.error('❌ Error setting up collections:', error.message);
        console.log('');
        console.log('Please make sure:');
        console.log('1. PocketBase server is running (http://127.0.0.1:8090)');
        console.log('2. You have created an admin account');
        console.log('3. Update the email/password in this script with your admin credentials');
    }
}

setupCollections();