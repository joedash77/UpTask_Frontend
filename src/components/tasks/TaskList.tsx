import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { Project, TaskProject, TaskStatus } from "@/types/index"
import TaskCard from "./TaskCard"
import { statusTranslations } from "@/locales/es"
import DropTask from "./DropTask"
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { updateStatus } from '@/api/TaskAPI'

type TaskListProps = {
    tasks: TaskProject[]
    canEdit: boolean
}

type GroupedTasks = {
    [key: string]: TaskProject[]
}

const initialStatusGroups: GroupedTasks = {
    pending: [],
    onHold: [],
    inProgress: [],
    underReview: [],
    completed: []
}

const statusStyles : { [key: string] : string } = {
    pending: 'border-t-slate-400',
    onHold: 'border-t-red-400',
    inProgress: 'border-t-blue-400',
    underReview: 'border-t-amber-400',
    completed: 'border-t-emerald-400',
}

export default function TaskList({ tasks, canEdit }: TaskListProps) {
    const params = useParams()
    const projectId = params.projectId!
    const navigate = useNavigate()

    const queryClient = useQueryClient()
    const { mutate } = useMutation({
        mutationFn: updateStatus,
        onError: (error) => {
            toast.error(error.message)
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({queryKey: ['project', projectId]})
            navigate(location.pathname, {replace: true})
            toast.success(data)
        }
    })

    const groupedTasks = tasks.reduce((acc, task) => { // se recorren todas las tareas y organizan en los diferentes estados
        let currentGroup = acc[task.status] ? [...acc[task.status]] : []; //Se obtiene el arreglo actual del estado de la tarea, si ya existe una lista, se copia, sino se usa un array vacio
        currentGroup = [...currentGroup, task] // Se agrega la tarea actual al grupo correspondiente
        return { ...acc, [task.status]: currentGroup }; // Se devuelve una copia de acc, agregando el grupo actualizado
    }, initialStatusGroups);

    const handleDragEnd = (e: DragEndEvent) => {
        const { over, active } = e

        if(over && active) {
            const taskId = active.id.toString()
            const status = over.id as TaskStatus
            mutate({ projectId, taskId, status })

            queryClient.setQueryData(['project', projectId], (prevData : Project) => {
                const updatedTask = prevData.tasks.map((task) => {
                    if(task._id === taskId) {
                        return {    
                            ...task,
                            status
                        }
                    }
                    return task
                })

                return {
                    ...prevData,
                    tasks: updatedTask
                }
            })
        }
    }

    return (
        <>
            <h2 className="text-5xl font-black my-10">Tareas</h2>

            <div className='flex gap-5 overflow-x-scroll 2xl:overflow-auto pb-32'>
                <DndContext onDragEnd={handleDragEnd}>  
                {Object.entries(groupedTasks).map(([status, tasks]) => (
                    <div key={status} className='min-w-[300px] 2xl:min-w-0 2xl:w-1/5'>
                        <h3 
                            className={`capitalize text-xl font-light border border-slate-300
                            bg-white p-3 border-t-8 ${statusStyles[status]}`}
                        >{statusTranslations[status]}</h3>

                        <DropTask status={status}/>

                        <ul className='mt-5 space-y-5'>
                            {tasks.length === 0 ? (
                                <li className="text-gray-500 text-center pt-3">No Hay tareas</li>
                            ) : (
                                tasks.map(task => <TaskCard key={task._id} task={task}
                                canEdit={canEdit}/>)
                            )}
                        </ul>
                    </div>
                ))}
                </DndContext>
            </div>
        </>
    )
}
