const SlippageWarning = ({ slippage }) => {
  return (
    <div
      className={`font-bold ${
        slippage <= 0.5
          ? 'text-th-green'
          : slippage > 0.5 && slippage <= 2
          ? 'text-th-orange'
          : 'text-th-red'
      } pt-2 rounded-md text-center text-th-fgd-3 text-xs`}
    >
      {slippage}% expected slippage
    </div>
  )
}

export default SlippageWarning
