import { Inbox } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TodoItem } from './TodoItem'
import type { Todo, Priority } from '../types/todo'

interface Props {
  todos: Todo[]
  activeTimerId: string | null
  getDisplayElapsed: (todo: Todo) => number
  onToggleComplete: (id: string) => void
  onToggleImportant: (id: string) => void
  onDelete: (id: string) => void
  onUpdateDescription: (id: string, description: string) => void
  onUpdateDueDate: (id: string, dueDate: string) => void
  onUpdateTags: (id: string, tags: string[]) => void
  onToggleTimer: (id: string) => void
  onResetTimer: (id: string) => void
  onUpdatePriority: (id: string, priority: Priority | undefined) => void
  onUpdateLink: (id: string, link: string) => void
  onAddSubtask: (id: string, title: string) => void
  onToggleSubtask: (id: string, subtaskId: string) => void
  onDeleteSubtask: (id: string, subtaskId: string) => void
  onReorder: (activeId: string, overId: string) => void
  selectable?: boolean
  selectedIds?: string[]
  onToggleSelect?: (id: string) => void
}

function SortableTodoItem({
  todo,
  activeTimerId,
  getDisplayElapsed,
  selectable,
  selectedIds,
  onToggleSelect,
  ...props
}: Omit<Props, 'todos' | 'onReorder'> & { todo: Todo }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: todo.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
      }}
    >
        <TodoItem
          todo={todo}
          isTimerActive={activeTimerId === todo.id}
          displayElapsed={getDisplayElapsed(todo)}
          selectable={selectable}
          selected={selectedIds?.includes(todo.id)}
          onToggleSelect={onToggleSelect}
          {...props}
          dragHandleProps={{ ...attributes, ...listeners }}
        />
    </div>
  )
}

export function TodoList({ todos, onReorder, ...itemProps }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    onReorder(String(active.id), String(over.id))
  }

  if (todos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3 text-zinc-700">
        <div className="size-12 rounded-full bg-white/[0.02] border border-white/[0.04] flex items-center justify-center">
          <Inbox size={22} strokeWidth={1.2} />
        </div>
        <span className="text-[13px] tracking-wide">할 일이 없습니다</span>
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={todos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 overflow-y-auto py-1">
          {todos.map((todo) => (
            <SortableTodoItem key={todo.id} todo={todo} {...itemProps} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
