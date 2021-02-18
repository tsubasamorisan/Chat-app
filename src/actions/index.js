import {
  NEW_USER_DATA,
  newUserDataState,
  AUTH_USER,
  LOGIN_USER_DATA,
  FORGOT_PASSWORD,
  RESET_PASSWORD_DATA,
} from "./types";
import axios from "../utils/axios";
import history from "../utils/history";
import { emailConfirmation, conversations } from "../utils/Routes";

export const setNewUserData = (
  newUser,
  username,
  email,
  password,
  confirmPassword,
  state
) => {
  if (newUser) {
    return {
      type: NEW_USER_DATA,
      payload: {
        username,
        email,
        password,
        confirmPassword,
        state,
      },
    };
  } else {
    return {
      type: NEW_USER_DATA,
      payload: null,
    };
  }
};

export const signupUser = () => async (dispatch, getState) => {
  const { newUserData } = getState();

  try {
    await axios.post("/api/v1/users/signup", newUserData);
    dispatch({
      type: NEW_USER_DATA,
      payload: {
        ...newUserData,
        state: newUserDataState.submitted,
      },
    });
    history.push(emailConfirmation);
  } catch (err) {
    dispatch({
      type: NEW_USER_DATA,
      payload: {
        ...newUserData,
        state: newUserDataState.failed,
      },
    });
  }
};

export const resendAccountActivateEmail = () => async (dispatch, getState) => {
  const { newUserData } = getState();

  dispatch({
    type: NEW_USER_DATA,
    payload: {
      ...newUserData,
      state: newUserDataState.resubmitting,
    },
  });

  try {
    await axios.post("/api/v1/users/resendActivationLink", {
      email: newUserData.email,
    });
    dispatch({
      type: NEW_USER_DATA,
      payload: {
        ...newUserData,
        state: newUserDataState.submitted,
      },
    });
    history.push(emailConfirmation);
  } catch (err) {
    dispatch({
      type: NEW_USER_DATA,
      payload: {
        ...newUserData,
        state: newUserDataState.emailNotExist,
      },
    });
  }
};

export const activateAccount = (token) => async (dispatch) => {
  dispatch({
    type: NEW_USER_DATA,
    payload: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      state: newUserDataState.activatingAccount,
    },
  });
  try {
    const user = await axios.get(`/api/v1/users/activateAccount/${token}`);
    const updateActiveState = await axios.patch(
      "/api/v1/users/updateMe",
      {
        isUserActive: true,
      },
      {
        headers: {
          authorization: `Bearer ${user.data.token}`,
        },
      }
    );

    dispatch({
      type: AUTH_USER,
      payload: {
        isLoggedIn: true,
        token: user.data.token,
        user: updateActiveState.data.user,
      },
    });

    dispatch({
      type: NEW_USER_DATA,
      payload: {
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        state: newUserDataState.accountActivated,
      },
    });
    history.push(conversations);
  } catch (err) {
    dispatch({
      type: NEW_USER_DATA,
      payload: {
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        state: newUserDataState.invalidToken,
      },
    });
  }
};

export const setLoginData = (mount, email, password) => {
  if (mount) {
    return {
      type: LOGIN_USER_DATA,
      payload: {
        email,
        password,
      },
    };
  } else {
    return {
      type: LOGIN_USER_DATA,
      payload: null,
    };
  }
};

export const loginUser = () => async (dispatch, getState) => {
  const { loginUserData } = getState();

  dispatch({
    type: LOGIN_USER_DATA,
    payload: {
      ...loginUserData,
      state: "submitting",
    },
  });

  try {
    const user = await axios.post("/api/v1/users/login", loginUserData);
    const updateActiveState = await axios.patch(
      "/api/v1/users/updateMe",
      {
        isUserActive: true,
      },
      {
        headers: {
          authorization: `Bearer ${user.data.token}`,
        },
      }
    );

    dispatch({
      type: AUTH_USER,
      payload: {
        isLoggedIn: true,
        token: user.data.token,
        user: updateActiveState.data.user,
      },
    });

    history.push(conversations);
  } catch (err) {
    dispatch({
      type: LOGIN_USER_DATA,
      payload: {
        ...loginUserData,
        loginFailed: true,
        state: "failed",
      },
    });
  }
};

export const setForgotPassword = (email, state, mount) => {
  if (mount) {
    return {
      type: FORGOT_PASSWORD,
      payload: {
        email,
        state,
      },
    };
  } else {
    return {
      type: FORGOT_PASSWORD,
      payload: null,
    };
  }
};

export const sendForgotPassword = () => async (dispatch, getState) => {
  const { email } = getState().forgotPassword;

  dispatch({
    type: FORGOT_PASSWORD,
    payload: {
      email,
      state: "submitting",
    },
  });

  try {
    await axios.post("/api/v1/users/forgotPassword", { email });
    dispatch({
      type: FORGOT_PASSWORD,
      payload: {
        email,
        state: "submitted",
      },
    });
  } catch (err) {
    dispatch({
      type: FORGOT_PASSWORD,
      payload: {
        email,
        state: "failed",
      },
    });
  }
};

export const setResetPassword = (mount, password, confirmPassword, state) => {
  if (mount) {
    return {
      type: RESET_PASSWORD_DATA,
      payload: {
        password,
        confirmPassword,
        state,
      },
    };
  } else {
    return {
      type: RESET_PASSWORD_DATA,
      payload: null,
    };
  }
};

export const resetPassword = (token) => async (dispatch, getState) => {
  const { resetPasswordData } = getState();

  dispatch({
    type: RESET_PASSWORD_DATA,
    payload: {
      ...resetPasswordData,
      state: "submitting",
    },
  });

  try {
    const user = await axios.patch(
      `/api/v1/users/resetPassword/${token}`,
      resetPasswordData
    );

    const updateActiveState = await axios.patch(
      "/api/v1/users/updateMe",
      {
        isUserActive: true,
      },
      {
        headers: {
          authorization: `Bearer ${user.data.token}`,
        },
      }
    );

    dispatch({
      type: AUTH_USER,
      payload: {
        isLoggedIn: true,
        token: user.data.token,
        user: updateActiveState.data.user,
      },
    });

    history.push(conversations);
  } catch (err) {
    dispatch({
      type: RESET_PASSWORD_DATA,
      payload: {
        ...resetPasswordData,
        state: newUserDataState.invalidToken,
      },
    });
  }
};
