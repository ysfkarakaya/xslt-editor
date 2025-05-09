<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:template match="/data">
        <html>
            <head>
                <title>XSLT Transformation</title>
            </head>
            <body>
                <h1>Items</h1>
                <xsl:for-each select="item">
                    <div>
                        <h2>
                            <xsl:value-of select="name"/>
                        </h2>
                        <p>
                            <xsl:value-of select="description"/>
                        </p>
                        <xsl:choose>
                            <xsl:when test="image = 'image1.jpg'">
                                <img src="image1.jpg"/>
                            </xsl:when>
                            <xsl:when test="image = 'image2.jpg'">
                                <img src="image2.jpg"/>
                            </xsl:when>
                        </xsl:choose>
                    </div>
                </xsl:for-each>
            </body>
        </html>
    </xsl:template>
</xsl:stylesheet>