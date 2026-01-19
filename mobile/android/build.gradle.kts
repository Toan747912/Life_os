allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}
subprojects {
    project.evaluationDependsOn(":app")
    
    if (project.name != "app") {
        afterEvaluate {
            val android = extensions.findByName("android")
            if (android != null) {
                try {
                    val getNamespace = android.javaClass.getMethod("getNamespace")
                    var namespace = getNamespace.invoke(android)
                    if (namespace == null) {
                        val setNamespace = android.javaClass.getMethod("setNamespace", String::class.java)
                        if (project.name == "isar_flutter_libs") {
                            setNamespace.invoke(android, "dev.isar.isar_flutter_libs")
                        } else {
                            setNamespace.invoke(android, "com.example.${project.name}")
                        }
                        println("Injected namespace for ${project.name}")
                    }
                } catch (e: Exception) {
                    // Ignore if method not found (older AGP or non-android project)
                }
            }
        }
    }
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
