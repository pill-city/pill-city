import React, {Component} from 'react';
import {Button, Grid, Message, Label, GridColumn} from 'semantic-ui-react'
import {Form, Input} from 'formsy-semantic-ui-react'
import {Redirect} from "react-router-dom";
import HomePage from "../../components/HomePage/HomePage";
import "./SignUp.css";

require('promise.prototype.finally').shim();

export default class SignUp extends Component {
  constructor(props) {
    super(props)
    this.state = {
      'error': '',
      'buttonEnabled': false,
      'loading': false,
      'redirectToSignIn': false
    }
  }

  handleFormValid = () => {
    this.setState({'buttonEnabled': true})
  }
  handleFormInvalid = () => {
    this.setState({'buttonEnabled': false})
  }
  showError = (err) => {
    this.setState({'error': err.toString()})
  }
  handleSubmit = (inputForm) => {
    const {id, password, confirmPassword} = inputForm
    if (id === undefined || id.trim() === "") {
      this.refs.form.updateInputsWithError({
        'id': 'Please enter id',
      })
      return
    }
    if (password === undefined || password.trim === "") {
      this.refs.form.updateInputsWithError({
        'password': 'Please enter password',
      })
      return
    } else if (password !== confirmPassword) {
      this.refs.form.updateInputsWithError({
        'confirmPassword': 'Password does not match'
      })
      return
    }

    this.setState({'loading': true})
    this.props.api.signUp(
      id, password
    ).then(() => {
      this.setState({'redirectToSignIn': true})
    }).catch((e) => {
        if (e.response.status === 409) {
          this.refs.form.updateInputsWithError({
            'id': 'This id has already been taken',
          })
          return
        }
      }
    ).finally(() => {
      this.setState({'loading': false})
    })
  }

  loginForm = () => {
    const errorLabel = <Label color="red" as="small" pointing/>
    return (
      <div className='login-form'>
        <style>{`
          body > div,
          body > div > div,
          body > div > div > div.login-form {
            height: 100%;
          }
        `}
        </style>
        <Grid textAlign='center' style={{height: '100%'}} verticalAlign='middle'>
          <GridColumn style={{maxWidth: 450}}>
            <div className="sign-up-title">
              Sign up
            </div>
            <Form
              ref='form'
              size='medium'
              loading={this.state.loading}
              onValid={this.handleFormValid}
              onInvalid={this.handleFormInvalid}
              onValidSubmit={this.handleSubmit}
            >
              <div className="signup-form-wrapper">
                <Input
                  fluid
                  name='id'
                  placeholder='ID'
                  errorLabel={errorLabel}

                />
                <Input
                  fluid
                  name='password'
                  placeholder='Password'
                  type='password'
                  errorLabel={errorLabel}
                />
                <Input
                  fluid
                  name='confirmPassword'
                  placeholder='Confirm password'
                  type='password'
                  errorLabel={errorLabel}
                />
                <Button
                  fluid
                  primary
                  size='large'
                  disabled={!this.state.buttonEnabled}
                >
                  Sign up
                </Button>
              </div>
            </Form>
            {this.state.error &&
            <Message negative>
              {this.state.error}
            </Message>
            }
            <div className="message-box-sign-in">
              Already have an account? <a className="sign-in-link" href='/signin'>Sign in here</a>
            </div>
          </GridColumn>
        </Grid>
      </div>
    )
  }

  render() {
    if (this.state.redirectToSignIn) {
      return <Redirect to={'/signin'}/>
    }

    return (
      <HomePage formElement={this.loginForm()}/>
    )
  }
}