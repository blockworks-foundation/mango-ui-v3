export const PageBodyWrapper = ({ children, className, ...props }) => (
  <div className={`${className} h-full`} {...props}>
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
  noMarginBottom = false,
  className = '',
}) => (
  <div
    className={`flex justify-center ${
      noMarginBottom ? 'mb-0' : 'mb-2.5'
    } -mt-1 text-base font-medium items-center text-th-fgd-1 ${className}`}
  >
    {children}
  </div>
)
