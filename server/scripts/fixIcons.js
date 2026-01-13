require('dotenv').config();
const supabase = require('../config/supabaseClient');

const updates = [
    { name: 'Food', icon: '🍔' },
    { name: 'Transport', icon: '🚕' },
    { name: 'Vibes', icon: '🎉' },
    { name: 'Housing', icon: '🏠' },
    { name: 'Utilities', icon: '⚡' },
    { name: 'Shopping', icon: '🛍️' },
    { name: 'Health', icon: '💊' },
    { name: 'Transfers', icon: '💸' },
    { name: 'Salary', icon: '💰' },
    { name: 'Savings', icon: '🐷' }
];

async function fixIcons() {
    console.log('Starting icon updates...');

    for (const update of updates) {
        const { error } = await supabase
            .from('categories')
            .update({ icon: update.icon })
            .eq('name', update.name);

        if (error) {
            console.error(`Failed to update ${update.name}:`, error.message);
        } else {
            console.log(`Updated ${update.name} -> ${update.icon}`);
        }
    }

    console.log('Done!');
}

fixIcons();
