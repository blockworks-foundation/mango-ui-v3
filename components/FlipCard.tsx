export const FlipCard = ({ children, ...props }) => {
  return (
    <div {...props} className="flipcard">
      {children}
    </div>
  )
}

export const FlipCardInner = (props) => {
  return (
    <div
      className="relative h-full w-full text-center"
      style={{
        transition: 'transform 0.8s ease-out',
        transformStyle: 'preserve-3d',
        transform: `${props.flip ? 'rotateY(0deg)' : 'rotateY(180deg)'}`,
      }}
    >
      {props.children}
    </div>
  )
}

export const FlipCardFront = (props) => {
  return <div className="flipcard-front h-full w-full">{props.children}</div>
}

export const FlipCardBack = ({ children }) => {
  return (
    <div
      className="absolute h-full w-full"
      style={{ transform: 'rotateY(180deg)' }}
    >
      {children}
    </div>
  )
}
