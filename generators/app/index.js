'use strict';

const
  Generator = require('yeoman-generator'),
  _ = require('lodash');
let
  questions = require('./resources/prompts'),
  initialPrompt = questions.initialPrompt,
  secondPrompt = questions.secondPrompt,
  pluginsPrompt = questions.pluginsPrompt;

const _plugins = require('./resources/plugins');

function setPrompts(answers){
  _.set(secondPrompt[0],'default', answers.name);

  if(answers.subDirConfim){
    return this.prompt(secondPrompt)
      .then((res)=>{
        _.set(answers,'subDir', res.subDir);
        return answers;
      });
  }

  return answers;
}
function setPlugins(answers){
  return this.prompt(pluginsPrompt)
    .then((res) =>{
      _.set(answers,'plugins', res);
      return answers;
    });
}
function finishPrompts(answers){
  let plugins = answers.plugins,
  path =  this.templatePath('skill/_MainStateMachine.js'),
  newPath =  this.templatePath('skill/MainStateMachine.js'),
  jsonPath = this.templatePath('_package.json'),
  jsonNewPath = this.templatePath('package.json'),
  jsonFile = JSON.parse(this.fs.read(jsonPath)),
  filerBuffer   = this.fs.read(path),
  hook  = '/*******  plugins  *******/',
  newBuffer = '',
  arrFiles = [];

  let dir = answers.subDirConfim ? answers.subDir + '/' : '';
  _.set(answers,'dir', dir);
  
  if(_.keys(answers).length > 0){
     _.forIn(plugins, (val, key) =>{
        if(val){
          let i = _.findIndex(_plugins,{name: key} ), 
          usage = _plugins[i].usage,
          dependencies = _plugins[i].dependencies,
          files = _plugins[i].files;

          if(dependencies){
            _.forEach(dependencies, function(item){
              _.set(jsonFile,`dependencies.${item.name}`,item.version); 
            });
          }

          if(files){
            _.forEach(files, function(item){
              arrFiles.push(item);
            });
          }
          //inserting usage
          newBuffer += usage + '\n\n';
          console.log(`plugin ${key} added`);
        }
      });

      //creating MainStateMachine
      newBuffer = filerBuffer.replace(hook, hook + '\n' + newBuffer + '\n');
      this.fs.write(newPath,newBuffer);

      //creating package.json
      this.fs.write(jsonNewPath,JSON.stringify(jsonFile, null, '\t'));
  }

  if(arrFiles.length > 0){
    _.set(answers,'services', arrFiles);  
  }

  console.log(answers);
  this.props = answers;
}


module.exports = Generator.extend({

  // Configurations will be loaded here.
  // Ask for user input
  prompting() {
    _.set(initialPrompt[0],'default', this.appname);
    return this.prompt(initialPrompt)
      .then(setPrompts.bind(this))
      .then(setPlugins.bind(this))
      .then(finishPrompts.bind(this));
  },

  // Writing Logic here
  writing: {
    // Copy the configuration files
    config: function () { 

      this.fs.copy(
        this.templatePath('.editorconfig'),
        this.destinationPath(this.props.dir + '.editorconfig')
      );
      this.fs.copy(
        this.templatePath('.eslintrc.json'),
        this.destinationPath(this.props.dir + '.eslintrc.json')
      );
      this.fs.copy(
        this.templatePath('.gitignore'),
        this.destinationPath(this.props.dir + '.gitignore')
      );
      this.fs.copy(
        this.templatePath('.nvmrc'),
        this.destinationPath(this.props.dir + '.nvmrc')
      );
      this.fs.copyTpl(
        this.templatePath('package.json'),
        this.destinationPath(this.props.dir + 'package.json'), {
          name: this.props.name,
          author: this.props.author
        }
      );
      this.fs.copy(
        this.templatePath('gulpfile.js'),
        this.destinationPath(this.props.dir + 'gulpfile.js')
      );
      this.fs.copyTpl(
        this.templatePath('README.md'),
        this.destinationPath(this.props.dir + 'README.md'), {
          name: this.props.name
        }
      );
      this.fs.copy(
        this.templatePath('server.js'),
        this.destinationPath(this.props.dir + 'server.js')
      );
      this.fs.copy(
        this.templatePath('serverless.yml'),
        this.destinationPath(this.props.dir + 'serverless.yml')
      );

      //Deleting unnecessary files created
      this.fs.delete(this.templatePath('package.json'));
    },

    // Copy application files
    app: function () {
      this.fs.copy(
        this.templatePath('config'),
        this.destinationPath(this.props.dir + 'config')
      );

      if(this.props.services){
        _.forEach(this.props.services, (item) =>{
          console.log('item ',item);
          this.fs.copy(
            this.templatePath(item),
            this.destinationPath(this.props.dir + item)
          );
        });
      }
      else{
        this.fs.copy(
          this.templatePath('services/.gitkeep'),
          this.destinationPath(this.props.dir + 'services/.gitkeep')
        );  
      }

      
      this.fs.copy(
        this.templatePath('skill'),
        this.destinationPath(this.props.dir + 'skill')
      );
      this.fs.copy(
        this.templatePath('speechAssets'),
        this.destinationPath(this.props.dir + 'speechAssets')
      );
      this.fs.copy(
        this.templatePath('test'),
        this.destinationPath(this.props.dir + 'test')
      );

      //Deleting unnecessary files created
      this.fs.delete(this.templatePath('skill/MainStateMachine.js'));
      this.fs.delete(this.destinationPath(this.props.dir + 'skill/_MainStateMachine.js'));
    },

    // Install Dependencies if wanted
    install: function () {
      //this.installDependencies();
    }
  }
});
