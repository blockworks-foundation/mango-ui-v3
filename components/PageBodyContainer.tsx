const PageBodyContainer = ({ children }) => (
  <div className="min-h-screen grid grid-cols-12 gap-4 pb-10">
    <div className="col-span-12 px-4 xl:px-10 xl:col-span-12 2xl:col-start-2 2xl:col-span-10">
      {children}
    </div>
  </div>
)

export default PageBodyContainer
