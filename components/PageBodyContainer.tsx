import { PageBodyWrapper } from './styles'

const PageBodyContainer = ({ children }) => (
  <PageBodyWrapper className="grid grid-cols-12 gap-4 pb-14">
    <div className="col-span-12 px-4 lg:px-10 xl:col-span-12 2xl:col-start-2 2xl:col-span-10">
      {children}
    </div>
  </PageBodyWrapper>
)

export default PageBodyContainer
