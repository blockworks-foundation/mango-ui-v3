const GradientText = (props) => (
  <span className="bg-gradient-to-bl from-mango-theme-green via-mango-theme-yellow-dark to-mango-theme-red-dark bg-clip-text text-transparent">
    {props.children}
  </span>
)

export default GradientText
