import { asyncHandler } from "../../middlewares/asyncHandler.js";
import * as invitationService from "./service.js";
import { sendResponse } from "../../utils/responseHandler.js";

export const sendInvite = asyncHandler(async (req, res) => {
    const created_by = req.user.id;
    const inviteData = { ...req.body, created_by };
    const invite = await invitationService.createInvitation(inviteData);
    sendResponse(res, {
        statusCode: 201,
        message: "Invitation sent successfully",
        data: invite,
    });
});

export const getInviteDetails = asyncHandler(async (req, res) => {
    const invite = await invitationService.getInvitationByToken(
        req.params.token,
    );
    sendResponse(res, {
        statusCode: 200,
        message: "Invitation details",
        data: invite,
    });
});

export const acceptInvite = asyncHandler(async (req, res) => {
    const user = await invitationService.acceptInvitation(
        req.params.token,
        req.body,
    );
    sendResponse(res, {
        statusCode: 201,
        message: "Invitation accepted, OTP sent",
        data: user,
    });
});

export const declineInvite = asyncHandler(async (req, res) => {
    const result = await invitationService.declineInvitation(req.params.token);
    sendResponse(res, {
        statusCode: 200,
        message: result.message,
    });
});

export const getTenantInvitations = asyncHandler(async (req, res) => {
    const invites = await invitationService.getTenantInvitations(
        req.params.tenantId,
    );
    sendResponse(res, {
        statusCode: 200,
        message: "Tenant invitations",
        data: invites,
    });
});

export const getPendingTenantInvitations = asyncHandler(async (req, res) => {
    const invites = await invitationService.getPendingTenantInvitations(
        req.params.tenantId,
    );
    sendResponse(res, {
        statusCode: 200,
        message: "Pending tenant invitations",
        data: invites,
    });
});

export const resendInvite = asyncHandler(async (req, res) => {
    const invite = await invitationService.resendInvitation(req.params.id, req.user.id);
    sendResponse(res, {
        statusCode: 200,
        message: "Invitation resent successfully",
        data: invite,
    });
});

export const deleteInvitation = async (req, res) => {
  try {
    const { id } = req.params;

    await invitationService.deleteInvitationService(id);

    sendResponse(res, {
      statusCode: 200,
      message: "Invitation deleted successfully",
    });
  } catch (err) {
    console.error(err);
    sendResponse(res, {
      statusCode: err.message === "Invitation not found" ? 404 : 500,
      message: err.message || "Failed to delete invitation",
    });
  }
};