const SwipeableTabs = ({ onChange, tabs, tabIndex }) => (
  <div className={`border-b border-th-fgd-4 mb-4 relative`}>
    <div
      className={`absolute bg-th-primary bottom-[-1px] default-transition left-0 h-0.5 w-16`}
      style={{
        maxWidth: '176px',
        transform: `translateX(${tabIndex * 100}%)`,
        width: `${100 / tabs.length}%`,
      }}
    />
    <nav className="-mb-px flex" aria-label="Tabs">
      {tabs.map((tabName, i) => (
        <a
          key={tabName}
          onClick={() => onChange(i)}
          className={`cursor-pointer default-transition flex font-semibold justify-center pb-4 pt-2 relative whitespace-nowrap hover:opacity-100
                  ${
                    tabIndex === i
                      ? `text-th-primary`
                      : `text-th-fgd-4 hover:text-th-primary`
                  }
                `}
          style={{ width: `${100 / tabs.length}%`, maxWidth: '176px' }}
        >
          {tabName}
        </a>
      ))}
    </nav>
  </div>
)

export default SwipeableTabs
