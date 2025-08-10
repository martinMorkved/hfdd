import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export type ProgramStructure =
    | "weekly"        // Traditional 7-day weeks
    | "rotating"      // A, B, C rotation
    | "block"         // Mesocycle blocks
    | "frequency";    // Full body, single template

export type Exercise = {
    id: string;
    name: string;
    description?: string;
    muscleGroup?: string;
};

export type WorkoutExercise = {
    id: string;
    exerciseId: string;
    exerciseName: string;
    sets: number;
    reps: number[];
    comment?: string;
    alternatives?: string[];
};

export type WorkoutDay = {
    id: string;
    name: string;
    exercises: WorkoutExercise[];
};

export type WorkoutWeek = {
    id: string;
    weekNumber: number;
    days: WorkoutDay[];
};

export type WorkoutProgram = {
    id: string;
    name: string;
    description?: string;
    structure: ProgramStructure;
    weeks: WorkoutWeek[];
};

export const useWorkoutProgram = () => {
    const { user } = useAuth();
    const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
    const [currentProgram, setCurrentProgram] = useState<WorkoutProgram | null>(null);
    const [programName, setProgramName] = useState("");
    const [programDescription, setProgramDescription] = useState("");
    const [programStructure, setProgramStructure] = useState<ProgramStructure>("weekly");
    const [loading, setLoading] = useState(true);

    // Load programs from database
    useEffect(() => {
        if (user) {
            loadPrograms();
        }
    }, [user]);

    const loadPrograms = async () => {
        try {
            setLoading(true);

            // Load programs
            const { data: programsData, error: programsError } = await supabase
                .from('workout_programs')
                .select('*')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false });

            if (programsError) {
                console.error('Error loading programs:', programsError);
                return;
            }

            // Load complete program data with weeks, days, and exercises
            const completePrograms = await Promise.all(
                (programsData || []).map(async (program) => {
                    const programWithData = await loadCompleteProgram(program.id);
                    return programWithData;
                })
            );

            setPrograms(completePrograms);
        } catch (err) {
            console.error('Error loading programs:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadCompleteProgram = async (programId: string): Promise<WorkoutProgram> => {
        // Load weeks
        const { data: weeksData, error: weeksError } = await supabase
            .from('workout_weeks')
            .select('*')
            .eq('program_id', programId)
            .order('week_number');

        if (weeksError) {
            console.error('Error loading weeks:', weeksError);
            return { id: programId, name: '', description: '', structure: 'weekly', weeks: [] };
        }

        // Load days and exercises for each week
        const weeks = await Promise.all(
            (weeksData || []).map(async (week) => {
                const { data: daysData, error: daysError } = await supabase
                    .from('workout_days')
                    .select('*')
                    .eq('week_id', week.id)
                    .order('day_order');

                if (daysError) {
                    console.error('Error loading days:', daysError);
                    return { id: week.id, weekNumber: week.week_number, days: [] };
                }

                // Load exercises for each day
                const days = await Promise.all(
                    (daysData || []).map(async (day) => {
                        const { data: exercisesData, error: exercisesError } = await supabase
                            .from('workout_exercises')
                            .select('*')
                            .eq('day_id', day.id)
                            .order('exercise_order');

                        if (exercisesError) {
                            console.error('Error loading exercises:', exercisesError);
                            return { id: day.id, name: day.name, exercises: [] };
                        }

                        const exercises: WorkoutExercise[] = (exercisesData || []).map(ex => ({
                            id: ex.id,
                            exerciseId: ex.exercise_id,
                            exerciseName: ex.exercise_name,
                            sets: ex.sets,
                            reps: ex.reps || [],
                            comment: ex.comment || undefined,
                            alternatives: ex.alternatives || []
                        }));

                        return { id: day.id, name: day.name, exercises };
                    })
                );

                return { id: week.id, weekNumber: week.week_number, days };
            })
        );

        // Get the base program data
        const { data: programData } = await supabase
            .from('workout_programs')
            .select('*')
            .eq('id', programId)
            .single();

        return {
            id: programId,
            name: programData?.name || '',
            description: programData?.description || '',
            structure: programData?.structure as ProgramStructure || 'weekly',
            weeks
        };
    };

    const createNewProgram = async () => {
        if (!programName.trim() || !user) return;

        try {
            // Create the program
            const { data: programData, error: programError } = await supabase
                .from('workout_programs')
                .insert([{
                    user_id: user.id,
                    name: programName,
                    description: programDescription,
                    structure: programStructure
                }])
                .select()
                .single();

            if (programError) {
                console.error('Error creating program:', programError);
                return;
            }

            // Create initial week
            const { data: weekData, error: weekError } = await supabase
                .from('workout_weeks')
                .insert([{
                    program_id: programData.id,
                    week_number: 1
                }])
                .select()
                .single();

            if (weekError) {
                console.error('Error creating week:', weekError);
                return;
            }

            // Create days based on structure
            let dayNames: string[] = [];
            if (programStructure === "weekly") {
                dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
            } else if (programStructure === "rotating") {
                dayNames = ["Day A", "Day B", "Day C"];
            } else if (programStructure === "block") {
                dayNames = ["Block 1", "Block 2", "Block 3", "Block 4"];
            } else if (programStructure === "frequency") {
                dayNames = ["Full Body Session"];
            }

            const daysToInsert = dayNames.map((name, index) => ({
                week_id: weekData.id,
                name,
                day_order: index + 1
            }));

            const { error: daysError } = await supabase
                .from('workout_days')
                .insert(daysToInsert);

            if (daysError) {
                console.error('Error creating days:', daysError);
                return;
            }

            // Reload programs
            await loadPrograms();

            // Reset form
            setProgramName("");
            setProgramDescription("");
            setProgramStructure("weekly");
        } catch (err) {
            console.error('Error creating program:', err);
        }
    };

    const updateProgramInArray = async (updatedProgram: WorkoutProgram) => {
        try {
            // Update the program in database
            const { error: programError } = await supabase
                .from('workout_programs')
                .update({
                    name: updatedProgram.name,
                    description: updatedProgram.description,
                    structure: updatedProgram.structure
                })
                .eq('id', updatedProgram.id);

            if (programError) {
                console.error('Error updating program:', programError);
                return;
            }

            // Update local state
            setPrograms(prev => prev.map(p => p.id === updatedProgram.id ? updatedProgram : p));
        } catch (err) {
            console.error('Error updating program:', err);
        }
    };

    const selectProgram = (program: WorkoutProgram) => {
        setCurrentProgram(program);
    };

    return {
        programs,
        currentProgram,
        setCurrentProgram,
        programName,
        setProgramName,
        programDescription,
        setProgramDescription,
        programStructure,
        setProgramStructure,
        createNewProgram,
        updateProgramInArray,
        selectProgram,
        loading
    };
}; 