export const ElementTitle = ({ children, noMarignBottom }) => (
  <div
    className={`flex justify-center ${
      noMarignBottom ? 'mb-0' : 'mb-4'
    } text-lg font-semibold items-center text-th-fgd-1`}
  >
    {children}
  </div>
)
