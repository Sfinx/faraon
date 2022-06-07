const eventsName = [
    'AfterExport',
    'AfterPlot',
    'Animated',
    'AnimatingFrame',
    'AnimationInterrupted',
    'AutoSize',
    'BeforeExport',
    'ButtonClicked',
    // 'Click',
    'SunBurstClick',
    'ClickAnnotation',
    'ContextMenu',
    'Deselect',
    'DoubleClick',
    'Framework',
    'Hover',
    'LegendClick',
    'LegendDoubleClick',
    'Relayout',
    'Restyle',
    'Redraw',
    'Selected',
    'Selecting',
    'SliderChange',
    'SliderEnd',
    'SliderStart',
    'Transitioning',
    'TransitionInterrupted',
    'Unhover'
  ]

  const events = eventsName
    .map(evt => evt.toLocaleLowerCase())
    .map(eventName => ({
      completeName: 'plotly_' + eventName,
      handler: context => (...args) => context.$emit.apply(eventName, args)
    }))

  export default events
