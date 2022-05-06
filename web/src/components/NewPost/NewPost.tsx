import React, {useEffect, useState} from 'react'
import {Dropdown, Popup, Icon, Checkbox} from 'semantic-ui-react'
import FormData from "form-data";
import {useHotkeys} from "react-hotkeys-hook";
import parseContent from "../../utils/parseContent";
import MediaPane from "../MediaPane/MediaPane";
import parseMentioned from "../../utils/parseMentioned";
import RoundAvatar from "../RoundAvatar/RoundAvatar";
import ClickableId from "../ClickableId/ClickableId";
import Circle from "../../models/Circle";
import Post, {ResharedPost} from "../../models/Post";
import {useToast} from "../Toast/ToastProvider";
import ApiError from "../../api/ApiError";
import ContentTextarea from "../ContentTextarea/ContentTextarea";
import {useAppSelector} from "../../store/hooks";
import {PhotographIcon} from "@heroicons/react/solid";
import PillModal from "../PillModal/PillModal";
import AddMedia from "../AddMedia/AddMedia";
import api from "../../api/Api";
import "./NewPost.css"
import Media from "../../models/Media";
import {arrayMoveImmutable} from "array-move";

interface Props {
  beforePosting: () => void
  afterPosting: (post: Post) => void
  resharePostData: Post | ResharedPost | null
  updateResharePostData: (post: Post | null) => void
}

type CircleIdOrPublic = string | true

interface NewPostMediaUploaded {
  type: 'Uploaded'
  media: File
}

interface NewPostMediaOwned {
  type: 'Owned'
  media: Media
}

export default (props: Props) => {
  const me = useAppSelector(state => state.me.me)
  const [myCircles, updateMyCircles] = useState<Circle[]>([])

  const [content, updateContent] = useState<string>("")
  const [circleIds, updateCircleIds] = useState<CircleIdOrPublic[]>([])
  const [resharable, updateResharable] = useState(true)
  const [medias, updateMedias] = useState<(NewPostMediaUploaded | NewPostMediaOwned)[]>([])
  const [mediaOpened, updateMediaOpened] = useState(false)

  const [posting, updatePosting] = useState(false)

  const {addToast, removeToast} = useToast()

  useEffect(() => {
    (async () => {
      updateMyCircles(await api.getCircles())
    })()
  }, [])

  useHotkeys('ctrl+enter', () => {
    (async () => {
      if (content.endsWith('\n')) {
        // if sent using ctrl+enter, there should be an extra newline at the end
        updateContent(content.substring(0, content.length - 1))
      }
      if (isValid()) {
        await postButtonOnClick()
      }
    })()
  }, {
    enableOnTags: ['TEXTAREA']
  })

  const isValid = () => {
    return (content.trim().length !== 0 || medias.length !== 0) && circleIds.length !== 0
  }

  const reset = () => {
    updateContent('')
    updateCircleIds([])
    updateResharable(true)
    updateMedias([])
  }

  const postButtonOnClick = async () => {
    if (posting) {
      return
    }
    updatePosting(true);

    // parse post parameters
    const actualCircleIds = circleIds.filter(cn => cn !== true)
    const isPublic = circleIds.filter(cn => cn === true).length !== 0

    // before sending post
    const toastId = addToast('Sending new post', false)
    props.beforePosting()

    // send post
    let post: Post | null = null
    try {
      post = await api.postPost(
        content,
        isPublic,
        actualCircleIds,
        props.resharePostData === null ? resharable : true,
        props.resharePostData === null ? null : props.resharePostData.id,
        props.resharePostData === null ? medias : [],
        parseMentioned(content),
      );
    } catch (e) {
      if (e instanceof ApiError) {
        addToast(e.message)
      } else {
        addToast('Unknown error')
      }
    }

    // after sending post
    reset()
    removeToast(toastId)
    if (post) {
      props.afterPosting(post)
      addToast('New post sent')
    }

    updatePosting(false)
  }

  const onChangeMedias = (fl: FileList) => {
    if (posting) {
      return
    }
    if (fl && fl[0]) {
      if (fl.length > 4) {
        alert(`Only allowed to upload 4 images`);
      } else {
        let selectedMedias = []
        for (let i = 0; i < fl.length; i++) {
          selectedMedias.push(fl[i])
        }
        updateMedias(medias.concat(selectedMedias.map(sm => {
          return {
            type: 'Uploaded',
            media: sm
          }
        })))
      }
    }
  }

  const sharingScopeOnChange = (e: any, {value}: any) => {
    e.preventDefault();
    if (posting) {
      return
    }
    updateCircleIds(value)
  }

  const resharableOnChange = (e: any) => {
    e.preventDefault();
    if (posting) {
      return
    }
    updateResharable(!resharable)
  }

  const submitButtonClass = () => {
    let className = ["new-post-post-btn"]
    if (!isValid()) {
      className.push("new-post-post-btn-invalid")
    }
    if (posting) {
      className.push("new-post-post-btn-loading")
    }
    return className.join(" ")
  }

  return (
    <div className="new-post">
      <div className="new-post-user-info">
        <div className="new-post-avatar">
          <RoundAvatar user={me}/>
        </div>
        <div className="new-post-name">
          <ClickableId user={me}/>
        </div>
      </div>
      {props.resharePostData === null ? null :
        <div className="new-post-reshare-preview">
          <div className="new-post-reshared-info-wrapper">
            <div className="new-post-reshared-info">
              <div className="post-avatar post-reshared-avatar">
                <RoundAvatar user={props.resharePostData.author}/>
              </div>
              <div className="post-reshared-author">
                <ClickableId user={props.resharePostData.author}/>
              </div>
            </div>
            <div className="new-post-reshare-delete" onClick={() => props.updateResharePostData(null)}>
              &times;
            </div>
          </div>
          <div className="post-content new-post-reshare-content-summary">
            {parseContent(props.resharePostData.content, "")}
          </div>
        </div>
      }
      {props.resharePostData === null &&
        <MediaPane
          mediaUrls={medias.map(m => {
            if (m.type === 'Uploaded') {
              return URL.createObjectURL(m.media)
            } else {
              return m.media.media_url
            }
          })}
          mediaOperations={[
            {
              op: '<',
              action: i => {
                if (i === 0) {
                  return
                }
                updateMedias(arrayMoveImmutable(medias, i - 1, i))
              }
            },
            {
              op: 'x',
              action: i => {
                updateMedias(medias.filter((_, ii) => i !== ii))
              }
            },
            {
              op: '>',
              action: i => {
                if (i === medias.length - 1) {
                  return
                }
                updateMedias(arrayMoveImmutable(medias, i, i + 1))
              }
            },
          ]}
        />
      }
      <div className="new-post-text-box-container">
        {props.resharePostData === null &&
          <>
            <PhotographIcon
              className='new-post-attachment-button'
              onClick={() => {
                if (!posting) {
                  updateMediaOpened(true)
                }
              }}
            />
            <PillModal
              isOpen={mediaOpened}
              onClose={() => {updateMediaOpened(false)}}
            >
              <AddMedia
                onChangeMedias={onChangeMedias}
                onSelectOwnedMedia={m => {
                  updateMedias(medias.concat([{
                    type: 'Owned',
                    media: m
                  }]))
                }}
                onClose={() => {updateMediaOpened(false)}}
              />
            </PillModal>
          </>
        }
        <ContentTextarea
          content={content}
          onChange={(newContent) => {
            updateContent(newContent)
          }}
          disabled={posting}
          textAreaClassName='new-post-text-box'
        />
      </div>

      <div className='new-post-circles-dropdown-wrapper'>
        <Dropdown
          placeholder='Who can see it'
          options={
            [{key: 'public', text: '🌏 Public', value: true}].concat(
              // @ts-ignore
              myCircles.map(circle => {
                const {name, id} = circle
                return {key: name, text: `⭕ ${name}`, value: id}
              })
            )
          }
          value={circleIds}
          onChange={sharingScopeOnChange}
          disabled={posting}
          fluid multiple selection
        />
        <Popup
          trigger={
            <Icon
              className='new-post-circles-dropdown-question'
              name='question circle outline'
            />
          }
          position='top right'
          basic
        >
          <p>"Public" means anyone on this site who follows you can see this post</p>
          <p>If you only pick circles, only people in these circles who follow you can see this post</p>
          <p>You can pick both "Public" and circles but that still means anyone on this site can see this post. Circle
            selections in this case are just for your own record</p>
        </Popup>
      </div>
      {props.resharePostData === null ?
        <div className="new-post-resharable">
          <Checkbox
            toggle
            label="Enable Resharing"
            onChange={resharableOnChange}
            checked={resharable}
            disabled={posting}
          />
          <Popup
            trigger={
              <Icon
                className='new-post-circles-dropdown-question'
                name='question circle outline'
              />
            }
            position='top right'
            basic
          >
            <p>If you enable resharing, other users can potentially reshare the post to "public" (anyone on this
              site)</p>
            <p>All interactions such as comments and reactions belong to the resharing post unless users explicitly
              click into your original post and interact with it</p>
          </Popup>
        </div> : null
      }
      <div className='new-post-btns'>
        {props.resharePostData === null ?
          <div className={submitButtonClass()} onClick={postButtonOnClick}>
            Post
          </div> :
          <Popup
            trigger={
              <div className={submitButtonClass()} onClick={postButtonOnClick}>
                Reshare
              </div>
            }
            position='top right'
            basic
          >
            <p>If you reshare a resharing post, you will be resharing the original post instead of the resharing
              post</p>
            <p>You post is reshareable by default</p>
          </Popup>
        }
      </div>
    </div>
  )
}
