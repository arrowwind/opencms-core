/*
 * File   : $Source: /alkacon/cvs/opencms/src/org/opencms/notification/CmsPublishNotification.java,v $
 * Date   : $Date: 2006/11/29 16:31:26 $
 * Version: $Revision: 1.3 $
 *
 * This library is part of OpenCms -
 * the Open Source Content Mananagement System
 *
 * Copyright (C) 2005 Alkacon Software GmbH (http://www.alkacon.com)
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * For further information about Alkacon Software GmbH, please see the
 * company website: http://www.alkacon.com
 *
 * For further information about OpenCms, please see the
 * project website: http://www.opencms.org
 * 
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
 */

package org.opencms.notification;

import org.opencms.file.CmsObject;
import org.opencms.file.CmsUser;
import org.opencms.report.I_CmsReport;

import java.util.Iterator;
import java.util.List;

/**
 * Class to send a notification to an OpenCms user with a summary of warnings and
 * errors occured while publishing the project.<p>
 * 
 * @author Peter Bonrad
 * 
 * @version $Revision: 1.3 $ 
 * 
 * @since 6.5.3
 */
public class CmsPublishNotification extends A_CmsNotification {

    /** The path to the xml content with the subject, header and footer of the notification e-mail.<p> */
    public static final String NOTIFICATION_CONTENT = "/system/workplace/admin/notification/publish-notification";

    /** The report containing the errors and warnings to put into the notification. */
    private I_CmsReport m_report;

    /**
     * Creates a new CmsPublishNotification.<p>
     * 
     * @param cms the cms object to use
     * @param receiver the cms user who should receive the message
     * @param report the report of the publishing which should be included in the message
     */
    public CmsPublishNotification(CmsObject cms, CmsUser receiver, I_CmsReport report) {

        super(cms, receiver);
        m_report = report;
    }

    /**
     * @see org.opencms.notification.A_CmsNotification#generateHtmlMsg()
     */
    protected String generateHtmlMsg() {

        StringBuffer buffer = new StringBuffer();

        // add warnings to the notification
        if (m_report.hasWarning()) {
            buffer.append("<b>");
            buffer.append(Messages.get().getBundle().key(Messages.GUI_PUBLISH_WARNING_HEADER_0));
            buffer.append("</b><br/>\n");
            appendList(buffer, m_report.getWarnings());
            buffer.append("<br/>\n");
        }

        // add errors to the notification
        if (m_report.hasError()) {
            buffer.append("<b>");
            buffer.append(Messages.get().getBundle().key(Messages.GUI_PUBLISH_ERROR_HEADER_0));
            buffer.append("</b><br/>\n");
            appendList(buffer, m_report.getErrors());
            buffer.append("<br/>\n");
        }

        return buffer.toString();
    }

    /**
     * @see org.opencms.notification.A_CmsNotification#getNotificationContent()
     */
    protected String getNotificationContent() {

        return NOTIFICATION_CONTENT;
    }

    /**
     * Appends the contents of a list to the buffer with every entry in a new line.<p>
     * 
     * @param buffer The buffer were the entries of the list will be appended.
     * @param list The list with the entries to append to the buffer.
     */
    private void appendList(StringBuffer buffer, List list) {

        Iterator iter = list.iterator();
        while (iter.hasNext()) {
            String entry = (String)iter.next();
            buffer.append(entry + "<br/>\n");
        }
    }

}
