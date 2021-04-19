export const ElementTitle = ({ children, noMarignBottom = false }) => (
  <div
    className={`flex justify-center ${
      noMarignBottom ? 'mb-0' : 'mb-2.5'
    } text-lg font-semibold items-center text-th-fgd-1`}
  >
    {children}
  </div>
)
