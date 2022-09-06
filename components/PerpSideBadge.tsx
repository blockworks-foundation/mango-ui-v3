import SideBadge from './SideBadge'

const PerpSideBadge = ({ basePosition }: { basePosition: number }) => (
  <>
    {basePosition !== 0 ? (
      <SideBadge side={basePosition > 0 ? 'long' : 'short'} />
    ) : (
      '--'
    )}
  </>
)

export default PerpSideBadge
