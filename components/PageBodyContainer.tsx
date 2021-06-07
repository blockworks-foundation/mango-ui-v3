const PageBodyContainer = ({ children }) => (
  <div className="min-h-screen grid grid-cols-12 gap-4 pb-10">
    <div className="col-span-12 px-6 xl:col-start-2 xl:col-span-10 2xl:col-start-3 2xl:col-span-8">
      {children}
    </div>
  </div>
)

export default PageBodyContainer
