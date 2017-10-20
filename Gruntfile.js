module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        connect: {
            server: {
                options: {
                    base: '',
                    port: 9999
                }
            }
        },

        template: {
            runtests: {
                options: {
                    data: {
                        process: {
                            env: process.env
                        }
                    }
                },
                files: {
                    'test/run-tests.html': ['test/run-tests.tpl.html']
                }
            }
        },

        browserify: {
            bip70: {
                options : {
                    browserifyOptions : {
                        standalone: 'bip70'
                    },
                    transform : ['brfs']
                },
                src: 'main.js',
                dest: 'build/bip70.js'
            },
            test: {
                options : {
                    browserifyOptions : {
                        standalone: 'bip70TEST'
                    },
                    transform : ['brfs']
                },
                src: 'test.js',
                dest: 'build/test.js'
            }
        },

        /*
         * Javascript uglifying
        */
        uglify : {
            options: {
                mangle: {
                    except: ['Buffer', 'BigInteger', 'Point', 'ECPubKey', 'ECKey', 'sha512_asm', 'asm', 'ECPair', 'HDNode']
                }
            },
            bip70: {
                files : {
                    'build/bip70.min.js'                       : ['<%= browserify.bip70.dest %>'],
                }
            },
            test: {
                files : {
                    'build/test.min.js' : ['<%= browserify.test.dest %>']
                }
            }
        },

        watch : {
            options : {},
            gruntfile : {
                files : ['Gruntfile.js'],
                tasks : ['default']
            },
            browserify : {
                files : ['main.js', 'lib/*', 'lib/**/*'],
                tasks : ['browserify:bip70']
            },
            browserify_test : {
                files : ['main.js', 'test.js', 'test/*', 'test/**/*', 'lib/*', 'lib/**/*', '!test/run-tests.html'],
                tasks : ['browserify:test']
            }
        },

        exec: {
            build_proto: {
                cmd: function() {
                    var inputFiles = ['proto/*.proto'];
                    var protoFiles = grunt.file.expand(inputFiles);

                    var command = '"./node_modules/.bin/pbjs" -t json ';
                    for (var i = 0; i < protoFiles.length; i++) {
                        command +=  " " + protoFiles[i] + " ";
                    }

                    command += " > lib/protofile.json";
                    console.log(command);
                    return command + ' && echo "completed compile"';
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-notify');
    grunt.loadNpmTasks('grunt-template');

    grunt.registerTask('build', ['exec:build_proto', 'browserify', 'uglify', 'template']);
    grunt.registerTask('default', ['build']);
};
