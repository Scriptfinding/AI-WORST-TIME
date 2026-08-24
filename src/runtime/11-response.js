/* @help Response
 * @sig $generateResponse(responseStatus, responseMessage, responseData?)
 * @desc Build a response object. When "Include input in output" is enabled in flow settings, the input is copied under a $input key.
 * @nodal-desc Build the final response returned by the flow.
 * @nodal-output object status:string, message:string, $context:object
 * @nodal-param responseStatus: Response status to return, usually "success" or "error".
 * @nodal-param responseMessage: Human-readable message shown in the run output.
 * @nodal-param responseData [custom-object]: Optional object merged into the response output.
 */
const $generateResponse = function(responseStatus, responseMessage, responseData) {
  console.debug('Generating response for flow with', responseStatus, 'status');
  if (responseStatus == 'error') {
    console.error(responseMessage);
  } else if (responseMessage !== undefined && responseMessage !== null && responseMessage !== '') {
    console.log(responseMessage);
  }
  console.debug('========================================');
  const { $context, ...inputData } = $json;
  const _resp = {
    "status": responseStatus,
    "message": responseMessage,
    ..._outputData,
    ...responseData,
  };
  _resp.$context = $context;
  const _envTrue = (v) => v === '1' || v === 'true';
  if (_envTrue(process.env.INCLUDE_INPUT_IN_OUTPUT)) {
    _resp.$input = inputData;
  }
  return _resp;
};

/* @help Response
 * @sig $generateResponseError(errorMessage, responseData?)
 * @desc Shorthand for $generateResponse("error", ...). Logs to stderr.
 * @nodal-desc Finish the flow with an error response.
 * @nodal-output object status:string, message:string, $context:object
 * @nodal-param errorMessage: Error message shown in the run output.
 * @nodal-param responseData [custom-object]: Optional object merged into the response output.
 */
const $generateResponseError = function(errorMessage, responseData) {
  return $generateResponse("error", errorMessage, responseData);
};

/* @help Response
 * @sig $generateResponseSuccess(successMessage, responseData?)
 * @desc Shorthand for $generateResponse("success", ...). Logs to stdout.
 * @nodal-desc Finish the flow with a success response.
 * @nodal-output object status:string, message:string, $context:object
 * @nodal-param successMessage: Success message shown in the run output.
 * @nodal-param responseData [custom-object]: Optional object merged into the response output.
 */
const $generateResponseSuccess = function(successMessage, responseData) {
  return $generateResponse("success", successMessage, responseData);
};

/* @help Response
 * @sig $stopFail(errorMessage, responseData?)
 * @desc Like $generateResponseError but immediately stops the run by throwing StopRun. Useful inside nested functions where you can't return from run().
 * @nodal-desc Stop the flow immediately and mark the run as failed.
 * @nodal-param errorMessage: Error message shown before stopping the flow.
 * @nodal-param responseData [custom-object]: Optional object merged into the response output before stopping.
 */
const $stopFail = function(errorMessage, responseData) {
  throw new StopRun(errorMessage, $generateResponseError(errorMessage, responseData));
};

/* @help Response
 * @sig $stopSuccess(successMessage, responseData?)
 * @desc Like $generateResponseSuccess but immediately stops the run by throwing StopRun. Useful inside nested functions where you can't return from run().
 * @nodal-desc Stop the flow immediately and mark the run as successful.
 * @nodal-param successMessage: Success message shown before stopping the flow.
 * @nodal-param responseData [custom-object]: Optional object merged into the response output before stopping.
 */
const $stopSuccess = function(successMessage, responseData) {
  throw new StopRun(successMessage, $generateResponseSuccess(successMessage, responseData));
};

