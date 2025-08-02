import { supabase } from '../lib/supabase';

// Get the current user ID for seeding data
const getCurrentUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
};

const sampleExercises = [
    { name: "Push Up", description: "A basic upper body exercise.", muscle_group: "Chest" },
    { name: "Squat", description: "A basic lower body exercise.", muscle_group: "Legs" },
    { name: "Pull Up", description: "Upper body pulling exercise.", muscle_group: "Back" },
    { name: "Deadlift", description: "Compound lower body exercise.", muscle_group: "Legs" },
    { name: "Bench Press", description: "Chest pressing exercise.", muscle_group: "Chest" },
    { name: "Overhead Press", description: "Shoulder pressing exercise.", muscle_group: "Shoulders" },
    { name: "Bent Over Row", description: "Back rowing exercise.", muscle_group: "Back" },
    { name: "Lunges", description: "Unilateral leg exercise.", muscle_group: "Legs" },
    { name: "Dips", description: "Tricep and chest exercise.", muscle_group: "Arms" },
    { name: "Plank", description: "Core stability exercise.", muscle_group: "Core" },
    { name: "Burpees", description: "Full body conditioning exercise.", muscle_group: "Full Body" },
    { name: "Mountain Climbers", description: "Cardio and core exercise.", muscle_group: "Core" },
    { name: "Jump Squats", description: "Explosive leg exercise.", muscle_group: "Legs" },
    { name: "Diamond Push Ups", description: "Tricep-focused push up variation.", muscle_group: "Arms" },
    { name: "Inverted Rows", description: "Bodyweight back exercise.", muscle_group: "Back" },
];

export const seedExercises = async () => {
    try {
        console.log('Starting to seed exercises...');

        // Get current user ID
        const userId = await getCurrentUserId();

        // Check if exercises already exist for this user
        const { data: existingExercises } = await supabase
            .from('exercises')
            .select('name')
            .eq('user_id', userId)
            .limit(1);

        if (existingExercises && existingExercises.length > 0) {
            console.log('Exercises already exist for this user, skipping seed.');
            return { success: true, message: 'Exercises already exist' };
        }

        // Insert sample exercises
        const { data, error } = await supabase
            .from('exercises')
            .insert(sampleExercises.map(exercise => ({
                ...exercise,
                user_id: userId
            })))
            .select();

        if (error) {
            console.error('Error seeding exercises:', error);
            return { success: false, error: error.message };
        }

        console.log(`Successfully seeded ${data?.length || 0} exercises`);
        return { success: true, data };
    } catch (err) {
        console.error('Error seeding exercises:', err);
        return { success: false, error: 'Failed to seed exercises' };
    }
}; 