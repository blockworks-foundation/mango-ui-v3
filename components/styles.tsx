export const PageBodyWrapper = ({ children, className, ...props }) => (
  <div className={`${className} min-h-screen`} {...props}>
    {children}
  </div>
)

// export const PageBodyWrapper = styled.div`
//   min-height: calc(100vh - 105px);
//   @media screen and (min-width: 768px) {
//     min-height: 100vh;
//   }
// `

export const ElementTitle = ({
  children,
  noMarignBottom = false,
  className = '',
}) => (
  <div
    className={`flex justify-center ${
      noMarignBottom ? 'mb-0' : 'mb-2.5'
    } text-lg font-semibold items-center text-th-fgd-1 ${className}`}
  >
    {children}
  </div>
)
