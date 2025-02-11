import { settings } from ".."
//@ts-ignore
import linkSrc from "../../assets-local/T-Pose.fbx"
import Model from "../display/Model"
//@ts-ignore
import personSrc from "../../assets-local/person.glb"
//@ts-ignore
import runningSrc from "../../assets-local/running 2.fbx"
//@ts-ignore
import idleSrc from "../../assets-local/idle 2.fbx"

export default {}

const model = new Model()
model.src = linkSrc
model.scale = 5
model.toon = true
model.frustumCulled = false
model.boxVisible = true
// model.animations = {
//     running: runningSrc,
//     idle: idleSrc
// }
// model.animation = ["running", "idle"]

settings.defaultOrbitControls = true

settings.fillWindow = true