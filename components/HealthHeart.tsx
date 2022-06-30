const HealthHeart = ({ health, size }: { health: number; size: number }) => {
  const styles = {
    height: `${size}px`,
    width: `${size}px`,
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={
        health > 15 && health < 50
          ? 'text-th-orange'
          : health > 50
          ? 'text-th-green'
          : 'text-th-red'
      }
      style={styles}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <g transform-origin="center">
        <path
          fillRule="evenodd"
          d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
          clipRule="evenodd"
        />
        <animateTransform
          attributeName="transform"
          type="scale"
          keyTimes="0;0.5;1"
          values="1;1.1;1"
          dur={health > 15 && health < 50 ? '1s' : health > 50 ? '2s' : '0.33s'}
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.8;1;0.8"
          dur={health > 15 && health < 50 ? '1s' : health > 50 ? '2s' : '0.33s'}
          repeatCount="indefinite"
        />
      </g>
    </svg>
  )
}

export default HealthHeart
