(module
  (func (export "contactImpulse")
    (param $overlap f32)
    (param $closingSpeed f32)
    (param $cohesion f32)
    (param $stiffness f32)
    (param $damping f32)
    (result f32)
    local.get $overlap
    local.get $stiffness
    f32.mul
    local.get $closingSpeed
    local.get $damping
    f32.mul
    f32.add
    local.get $cohesion
    f32.const 0.08
    f32.mul
    f32.add
  )

  (func (export "phaseState")
    (param $kinetic f32)
    (param $contactDensity f32)
    (param $cohesion f32)
    (param $fluidization f32)
    (result f32)
    local.get $contactDensity
    f32.const 0.55
    f32.sub
    local.get $cohesion
    f32.const 0.45
    f32.mul
    f32.add
    local.get $kinetic
    f32.const 0.25
    f32.mul
    f32.sub
    local.get $fluidization
    f32.const 0.65
    f32.mul
    f32.sub
    f32.const 3
    f32.mul
    f32.const 0.5
    f32.add
    f32.const 1
    f32.min
    f32.const 0
    f32.max
  )
)

