const PageBodyContainer = ({ children }) => (
  <div className="min-h-screen grid grid-cols-12 gap-4 pb-10">
    <div className="col-span-12 px-6 lg:col-start-2 lg:col-span-10 2xl:col-start-5 2xl:col-span-6">
      {children}
    </div>
  </div>
)

export default PageBodyContainer
