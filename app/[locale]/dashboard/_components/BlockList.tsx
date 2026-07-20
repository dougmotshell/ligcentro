'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Block } from '@/lib/db/types';
import { BlockForm } from './BlockForm';

interface Props {
  blocks: Block[];
  onBlocksChange(blocks: Block[]): void;
}

interface SortableItemProps {
  block: Block;
  onEdit(block: Block): void;
  onDelete(block: Block): void;
}

function SortableItem({ block, onEdit, onDelete }: SortableItemProps) {
  const t = useTranslations('Dashboard.blocks');
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: block.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li ref={setNodeRef} style={style} className="rounded-2xl border border-border bg-white p-4 shadow-sm dark:bg-gray-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{block.label}</p>
          <p className="text-sm text-muted-foreground">{t(`types.${block.type}`)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="rounded-xl border border-border px-3 py-2 text-sm font-medium transition hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t('reorder')}
          </button>
          <button
            type="button"
            onClick={() => onEdit(block)}
            className="rounded-xl border border-border px-3 py-2 text-sm font-medium transition hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t('edit')}
          </button>
          <button
            type="button"
            onClick={() => onDelete(block)}
            className="rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t('delete')}
          </button>
        </div>
      </div>
    </li>
  );
}

export function BlockList({ blocks, onBlocksChange }: Props) {
  const t = useTranslations('Dashboard.blocks');
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor));

  const sortedBlocks = useMemo(
    () => [...blocks].sort((left, right) => left.position - right.position),
    [blocks]
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sortedBlocks.findIndex((block) => block.id === active.id);
    const newIndex = sortedBlocks.findIndex((block) => block.id === over.id);
    const reordered = arrayMove(sortedBlocks, oldIndex, newIndex).map((block, index) => ({
      ...block,
      position: index,
    }));

    onBlocksChange(reordered);
    const response = await fetch('/api/blocks/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: reordered.map(({ id, position }) => ({ id, position })) }),
    });

    if (!response.ok) {
      onBlocksChange(sortedBlocks);
      return;
    }

    const result = (await response.json()) as { blocks: Block[] };
    onBlocksChange(result.blocks);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('title')}</h2>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingBlock(null);
            setIsModalOpen(true);
          }}
          className="rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t('createCta')}
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => void handleDragEnd(event)}>
        <SortableContext items={sortedBlocks.map((block) => block.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-3">
            {sortedBlocks.map((block) => (
              <SortableItem
                key={block.id}
                block={block}
                onEdit={(nextBlock) => {
                  setEditingBlock(nextBlock);
                  setIsModalOpen(true);
                }}
                onDelete={async (nextBlock) => {
                  const response = await fetch(`/api/blocks/${nextBlock.id}`, { method: 'DELETE' });
                  if (!response.ok) {
                    return;
                  }
                  onBlocksChange(sortedBlocks.filter((item) => item.id !== nextBlock.id));
                }}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <BlockForm
        open={isModalOpen}
        block={editingBlock}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (values) => {
          const payload = {
            type: values.type,
            label: values.label,
            url: values.url,
            brand: values.brand,
            contactType: values.contactType,
            contactValue: values.contactValue,
            visibleFrom: values.visibleFrom || null,
            visibleUntil: values.visibleUntil || null,
            isActive: values.isActive,
          };

          if (editingBlock) {
            const response = await fetch(`/api/blocks/${editingBlock.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            if (!response.ok) {
              throw new Error('request_failed');
            }
            const result = (await response.json()) as { block: Block };
            onBlocksChange(sortedBlocks.map((block) => (block.id === result.block.id ? result.block : block)));
            return;
          }

          const response = await fetch('/api/blocks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!response.ok) {
            throw new Error('request_failed');
          }
          const result = (await response.json()) as { block: Block };
          onBlocksChange([...sortedBlocks, result.block].sort((left, right) => left.position - right.position));
        }}
      />
    </div>
  );
}
