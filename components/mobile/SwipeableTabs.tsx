import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/outline'
import useDrag from 'hooks/useDrag'
import { useTranslation } from 'next-i18next'
import React, { useContext, useEffect, useState } from 'react'
import {
  ScrollMenu,
  VisibilityContext,
  getItemsPos,
  slidingWindow,
} from 'react-horizontal-scrolling-menu'

type scrollVisibilityApiType = React.ContextType<typeof VisibilityContext>

function SwipeableTabs({ items, onChange, tabIndex }) {
  const { dragStart, dragStop, dragMove, dragging } = useDrag()

  const handleDrag =
    ({ scrollContainer }: scrollVisibilityApiType) =>
    (ev: React.MouseEvent) =>
      dragMove(ev, (posDiff) => {
        if (scrollContainer.current) {
          scrollContainer.current.scrollLeft += posDiff
        }
      })

  const handleItemClick =
    (itemId: string) =>
    ({ getItemById, scrollToItem }: scrollVisibilityApiType) => {
      if (dragging) {
        return false
      }
      onChange(parseInt(itemId))
      scrollToItem(getItemById(itemId), 'smooth', 'center', 'nearest')
    }

  return (
    <div
      onMouseLeave={dragStop}
      className="thin-scroll relative mb-4 border-b border-th-fgd-4 px-4"
    >
      <ScrollMenu
        LeftArrow={LeftArrow}
        RightArrow={RightArrow}
        onWheel={onWheel}
        onMouseDown={() => dragStart}
        onMouseUp={({
            getItemById,
            scrollToItem,
            visibleItems,
          }: scrollVisibilityApiType) =>
          () => {
            dragStop()
            const { center } = getItemsPos(visibleItems)
            scrollToItem(getItemById(center), 'smooth', 'center')
          }}
        options={{ throttle: 0 }}
        onMouseMove={handleDrag}
        onUpdate={({
            getItemById,
            scrollToItem,
            visibleItems,
          }: scrollVisibilityApiType) =>
          () => {
            dragStop()
            const { center } = getItemsPos(visibleItems)
            scrollToItem(getItemById(center), 'smooth', 'center')
          }}
      >
        {items.map((item, i) => (
          <Card
            title={item}
            itemId={i.toString()}
            key={item}
            onClick={handleItemClick(i.toString())}
            selected={i === tabIndex}
          />
        ))}
      </ScrollMenu>
    </div>
  )
}
export default SwipeableTabs

function onWheel(
  { getItemById, items, visibleItems, scrollToItem }: scrollVisibilityApiType,
  ev: React.WheelEvent
): void {
  const isThouchpad = Math.abs(ev.deltaX) !== 0 || Math.abs(ev.deltaY) < 15

  if (isThouchpad) {
    ev.stopPropagation()
    return
  }

  if (ev.deltaY < 0) {
    const nextGroupItems = slidingWindow(
      items.toItemsKeys(),
      visibleItems
    ).next()
    const { center } = getItemsPos(nextGroupItems)
    scrollToItem(getItemById(center), 'smooth', 'center')
  } else if (ev.deltaY > 0) {
    const prevGroupItems = slidingWindow(
      items.toItemsKeys(),
      visibleItems
    ).prev()
    const { center } = getItemsPos(prevGroupItems)
    scrollToItem(getItemById(center), 'smooth', 'center')
  }
}

function Card({
  selected,
  onClick,
  title,
}: {
  itemId: string
  selected: boolean
  onClick: (x) => void
  title: string
}) {
  const { t } = useTranslation('common')
  const visibility = React.useContext(VisibilityContext)

  useEffect(() => {
    if (selected) {
      onClick(visibility)
    }
  }, [selected])

  return (
    <div
      onClick={() => onClick(visibility)}
      role="button"
      tabIndex={0}
      className={`flex h-10 w-32 items-center justify-center ${
        selected
          ? 'border-b-2 border-th-primary text-th-primary'
          : 'border-b-2 border-transparent text-th-fgd-3'
      }`}
    >
      {t(title)}
    </div>
  )
}

function Arrow({
  children,
  disabled,
  onClick,
  className,
}: {
  children: React.ReactNode
  disabled: boolean
  onClick: VoidFunction
  className?: string
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`top-1/2 -translate-y-1/2 transform rounded-none ${
        disabled ? 'hidden' : 'absolute'
      } ${className}`}
    >
      {children}
    </button>
  )
}

function LeftArrow() {
  const {
    isFirstItemVisible,
    scrollPrev,
    visibleItemsWithoutSeparators,
    initComplete,
  } = useContext(VisibilityContext)

  const [disabled, setDisabled] = useState(
    !initComplete || (initComplete && isFirstItemVisible)
  )
  useEffect(() => {
    if (visibleItemsWithoutSeparators.length) {
      setDisabled(isFirstItemVisible)
    }
  }, [isFirstItemVisible, visibleItemsWithoutSeparators])

  return (
    <Arrow disabled={disabled} onClick={() => scrollPrev()} className="-left-2">
      <ChevronLeftIcon className="h-5 w-5 text-th-fgd-3" />
    </Arrow>
  )
}

function RightArrow() {
  const { isLastItemVisible, scrollNext, visibleItemsWithoutSeparators } =
    useContext(VisibilityContext)

  const [disabled, setDisabled] = useState(
    !visibleItemsWithoutSeparators.length && isLastItemVisible
  )
  useEffect(() => {
    if (visibleItemsWithoutSeparators.length) {
      setDisabled(isLastItemVisible)
    }
  }, [isLastItemVisible, visibleItemsWithoutSeparators])

  return (
    <Arrow
      disabled={disabled}
      onClick={() => scrollNext()}
      className="-right-2"
    >
      <ChevronRightIcon className="h-5 w-5 text-th-fgd-3" />
    </Arrow>
  )
}
